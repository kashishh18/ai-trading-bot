import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import yfinance as yf
import warnings
warnings.filterwarnings('ignore')

class RiskManager:
    """
    This is your smart money bodyguard! 🛡️
    It makes sure you don't lose all your money on risky trades.
    Think of it like a wise friend who stops you from doing something dumb.
    """
    
    def __init__(self, initial_balance: float = 100000):
        """Initialize with starting money (default $100,000 fake money for testing)"""
        self.initial_balance = initial_balance
        self.current_balance = initial_balance
        self.max_risk_per_trade = 0.02  # Never risk more than 2% per trade
        self.max_portfolio_risk = 0.20  # Never risk more than 20% of total money
        self.max_positions = 10  # Don't hold more than 10 different stocks
        self.stop_loss_percent = 0.08  # Sell if stock drops 8%
        self.take_profit_percent = 0.15  # Sell if stock gains 15%
        self.min_confidence = 0.6  # Only trade if AI is 60%+ confident
        self.portfolio = {}  # Track our current holdings
        self.trade_history = []  # Remember all our trades
        self.blacklisted_stocks = set()  # Stocks we don't want to touch
        
    def calculate_position_size(self, symbol: str, entry_price: float, 
                              confidence: float, volatility: float = None) -> Dict:
        """
        Calculate how much money to invest in this trade
        This is SUPER important - it keeps us from betting too much!
        """
        try:
            # Base position size (start with 2% of our money)
            base_risk = self.current_balance * self.max_risk_per_trade
            
            # Adjust based on AI confidence
            confidence_multiplier = max(0.5, min(1.5, confidence))
            adjusted_risk = base_risk * confidence_multiplier
            
            # Adjust based on volatility (if we have it)
            if volatility is not None:
                # Higher volatility = smaller position
                volatility_multiplier = max(0.5, min(1.2, 1 / (1 + volatility)))
                adjusted_risk *= volatility_multiplier
            
            # Calculate number of shares we can buy
            max_shares = int(adjusted_risk / entry_price)
            
            # Make sure we don't exceed our limits
            portfolio_value = self.get_portfolio_value()
            if portfolio_value > 0:
                current_risk = (adjusted_risk / portfolio_value)
                if current_risk > self.max_portfolio_risk:
                    # Scale down the position
                    scale_factor = self.max_portfolio_risk / current_risk
                    max_shares = int(max_shares * scale_factor)
            
            # Calculate actual investment amount
            investment_amount = max_shares * entry_price
            
            # Make sure we have enough money
            if investment_amount > self.current_balance * 0.9:  # Keep 10% cash
                available_cash = self.current_balance * 0.9
                max_shares = int(available_cash / entry_price)
                investment_amount = max_shares * entry_price
            
            return {
                "symbol": symbol,
                "shares": max_shares,
                "investment_amount": round(investment_amount, 2),
                "entry_price": entry_price,
                "risk_amount": round(adjusted_risk, 2),
                "confidence_used": confidence,
                "position_valid": max_shares > 0 and investment_amount > 100  # Min $100 trade
            }
            
        except Exception as e:
            print(f"❌ Error calculating position size: {e}")
            return {"position_valid": False, "error": str(e)}
    
    def should_enter_trade(self, prediction: Dict) -> Tuple[bool, str]:
        """
        Decide if we should make this trade
        Returns: (should_trade, reason)
        """
        symbol = prediction.get("symbol")
        confidence = prediction.get("confidence", 0)
        predicted_change = prediction.get("percent_change", 0)
        signal = prediction.get("signal", "HOLD")
        
        # Check if stock is blacklisted
        if symbol in self.blacklisted_stocks:
            return False, f"{symbol} is blacklisted"
        
        # Check minimum confidence
        if confidence < self.min_confidence:
            return False, f"Confidence too low: {confidence:.2%} < {self.min_confidence:.2%}"
        
        # Check if signal is actionable
        if signal == "HOLD":
            return False, "Signal is HOLD"
        
        # Check if we already have too many positions
        if len(self.portfolio) >= self.max_positions and symbol not in self.portfolio:
            return False, f"Too many positions: {len(self.portfolio)}/{self.max_positions}"
        
        # Check minimum expected return
        min_expected_return = 3.0  # We want at least 3% expected gain
        if signal == "BUY" and predicted_change < min_expected_return:
            return False, f"Expected return too low: {predicted_change:.2f}% < {min_expected_return}%"
        
        # Check if we have enough money
        available_cash = self.current_balance * 0.1  # Keep 10% minimum cash
        if self.current_balance - available_cash < 100:  # Need at least $100 to trade
            return False, "Insufficient funds"
        
        # All checks passed!
        return True, f"Trade approved: {signal} {symbol} with {confidence:.2%} confidence"
    
    def calculate_stop_loss_take_profit(self, entry_price: float, signal: str) -> Dict:
        """Calculate stop loss and take profit levels"""
        if signal == "BUY":
            stop_loss = entry_price * (1 - self.stop_loss_percent)
            take_profit = entry_price * (1 + self.take_profit_percent)
        else:  # SELL (for short positions)
            stop_loss = entry_price * (1 + self.stop_loss_percent)
            take_profit = entry_price * (1 - self.take_profit_percent)
        
        return {
            "stop_loss": round(stop_loss, 2),
            "take_profit": round(take_profit, 2),
            "stop_loss_percent": self.stop_loss_percent,
            "take_profit_percent": self.take_profit_percent
        }
    
    def enter_position(self, prediction: Dict) -> Dict:
        """Execute a trade (buy or sell)"""
        symbol = prediction["symbol"]
        signal = prediction["signal"]
        entry_price = prediction["current_price"]
        confidence = prediction["confidence"]
        
        # Check if we should make this trade
        should_trade, reason = self.should_enter_trade(prediction)
        if not should_trade:
            return {
                "success": False,
                "reason": reason,
                "symbol": symbol
            }
        
        # Calculate position size
        position_info = self.calculate_position_size(symbol, entry_price, confidence)
        
        if not position_info.get("position_valid", False):
            return {
                "success": False,
                "reason": "Invalid position size calculation",
                "symbol": symbol
            }
        
        # Calculate stop loss and take profit
        risk_levels = self.calculate_stop_loss_take_profit(entry_price, signal)
        
        # Create position record
        position = {
            "symbol": symbol,
            "signal": signal,
            "shares": position_info["shares"],
            "entry_price": entry_price,
            "investment_amount": position_info["investment_amount"],
            "stop_loss": risk_levels["stop_loss"],
            "take_profit": risk_levels["take_profit"],
            "entry_date": datetime.now().isoformat(),
            "confidence": confidence,
            "predicted_change": prediction.get("percent_change", 0),
            "current_price": entry_price,
            "unrealized_pnl": 0.0,
            "status": "OPEN"
        }
        
        # Add to portfolio
        self.portfolio[symbol] = position
        
        # Update cash balance
        self.current_balance -= position_info["investment_amount"]
        
        # Record trade
        trade_record = {
            "type": "ENTRY",
            "symbol": symbol,
            "signal": signal,
            "shares": position_info["shares"],
            "price": entry_price,
            "amount": position_info["investment_amount"],
            "timestamp": datetime.now().isoformat(),
            "reason": f"AI prediction: {prediction.get('percent_change', 0):.2f}% with {confidence:.2%} confidence"
        }
        self.trade_history.append(trade_record)
        
        print(f"✅ Entered {signal} position: {position_info['shares']} shares of {symbol} @ ${entry_price}")
        
        return {
            "success": True,
            "position": position,
            "trade_record": trade_record
        }
    
    def update_positions(self) -> Dict:
        """Update all current positions with latest prices"""
        if not self.portfolio:
            return {"message": "No positions to update"}
        
        updated_positions = []
        total_pnl = 0.0
        
        for symbol, position in self.portfolio.items():
            try:
                # Get current price
                ticker = yf.Ticker(symbol)
                current_data = ticker.history(period="1d")
                
                if current_data.empty:
                    continue
                
                current_price = current_data['Close'].iloc[-1]
                position["current_price"] = current_price
                
                # Calculate unrealized P&L
                if position["signal"] == "BUY":
                    pnl = (current_price - position["entry_price"]) * position["shares"]
                else:  # SELL
                    pnl = (position["entry_price"] - current_price) * position["shares"]
                
                position["unrealized_pnl"] = round(pnl, 2)
                total_pnl += pnl
                
                # Check if we should exit (stop loss or take profit)
                should_exit, exit_reason = self.should_exit_position(symbol, position, current_price)
                
                if should_exit:
                    exit_result = self.exit_position(symbol, current_price, exit_reason)
                    if exit_result["success"]:
                        updated_positions.append({
                            "symbol": symbol,
                            "action": "EXITED",
                            "reason": exit_reason,
                            "pnl": exit_result.get("realized_pnl", 0)
                        })
                else:
                    updated_positions.append({
                        "symbol": symbol,
                        "action": "UPDATED",
                        "current_price": current_price,
                        "unrealized_pnl": pnl
                    })
                
            except Exception as e:
                print(f"❌ Error updating {symbol}: {e}")
        
        return {
            "updated_positions": updated_positions,
            "total_unrealized_pnl": round(total_pnl, 2),
            "portfolio_value": self.get_portfolio_value()
        }
    
    def should_exit_position(self, symbol: str, position: Dict, current_price: float) -> Tuple[bool, str]:
        """Check if we should exit a position"""
        signal = position["signal"]
        entry_price = position["entry_price"]
        stop_loss = position["stop_loss"]
        take_profit = position["take_profit"]
        
        if signal == "BUY":
            # Check stop loss
            if current_price <= stop_loss:
                return True, f"Stop loss triggered: ${current_price} <= ${stop_loss}"
            
            # Check take profit
            if current_price >= take_profit:
                return True, f"Take profit triggered: ${current_price} >= ${take_profit}"
        
        else:  # SELL position
            # Check stop loss
            if current_price >= stop_loss:
                return True, f"Stop loss triggered: ${current_price} >= ${stop_loss}"
            
            # Check take profit
            if current_price <= take_profit:
                return True, f"Take profit triggered: ${current_price} <= ${take_profit}"
        
        # Check time-based exit (don't hold positions too long)
        entry_date = datetime.fromisoformat(position["entry_date"])
        days_held = (datetime.now() - entry_date).days
        
        if days_held > 30:  # Exit after 30 days
            return True, f"Time-based exit: held for {days_held} days"
        
        return False, "Position within acceptable parameters"
    
    def exit_position(self, symbol: str, exit_price: float, reason: str) -> Dict:
        """Close a position"""
        if symbol not in self.portfolio:
            return {"success": False, "reason": f"No position found for {symbol}"}
        
        position = self.portfolio[symbol]
        
        # Calculate realized P&L
        if position["signal"] == "BUY":
            realized_pnl = (exit_price - position["entry_price"]) * position["shares"]
        else:  # SELL
            realized_pnl = (position["entry_price"] - exit_price) * position["shares"]
        
        # Calculate proceeds
        proceeds = exit_price * position["shares"]
        
        # Update cash balance
        self.current_balance += proceeds
        
        # Record trade
        trade_record = {
            "type": "EXIT",
            "symbol": symbol,
            "signal": "CLOSE_" + position["signal"],
            "shares": position["shares"],
            "price": exit_price,
            "amount": proceeds,
            "realized_pnl": round(realized_pnl, 2),
            "timestamp": datetime.now().isoformat(),
            "reason": reason,
            "days_held": (datetime.now() - datetime.fromisoformat(position["entry_date"])).days
        }
        self.trade_history.append(trade_record)
        
        # Remove from portfolio
        del self.portfolio[symbol]
        
        print(f"🔄 Exited position: {symbol} @ ${exit_price} | P&L: ${realized_pnl:.2f} | Reason: {reason}")
        
        return {
            "success": True,
            "realized_pnl": round(realized_pnl, 2),
            "proceeds": round(proceeds, 2),
            "trade_record": trade_record
        }
    
    def get_portfolio_value(self) -> float:
        """Calculate total portfolio value"""
        portfolio_value = self.current_balance
        
        for symbol, position in self.portfolio.items():
            market_value = position["current_price"] * position["shares"]
            portfolio_value += market_value
        
        return round(portfolio_value, 2)
    
    def get_portfolio_summary(self) -> Dict:
        """Get detailed portfolio summary"""
        total_value = self.get_portfolio_value()
        total_invested = sum(pos["investment_amount"] for pos in self.portfolio.values())
        total_unrealized = sum(pos.get("unrealized_pnl", 0) for pos in self.portfolio.values())
        
        # Calculate total realized P&L from trade history
        total_realized = sum(
            trade.get("realized_pnl", 0) 
            for trade in self.trade_history 
            if trade["type"] == "EXIT"
        )
        
        # Calculate performance metrics
        total_return = total_value - self.initial_balance
        total_return_percent = (total_return / self.initial_balance) * 100
        
        # Win rate
        exit_trades = [t for t in self.trade_history if t["type"] == "EXIT"]
        if exit_trades:
            winning_trades = len([t for t in exit_trades if t.get("realized_pnl", 0) > 0])
            win_rate = (winning_trades / len(exit_trades)) * 100
        else:
            win_rate = 0
        
        return {
            "total_value": total_value,
            "cash_balance": round(self.current_balance, 2),
            "invested_amount": round(total_invested, 2),
            "unrealized_pnl": round(total_unrealized, 2),
            "realized_pnl": round(total_realized, 2),
            "total_return": round(total_return, 2),
            "total_return_percent": round(total_return_percent, 2),
            "win_rate": round(win_rate, 2),
            "number_of_positions": len(self.portfolio),
            "max_positions": self.max_positions,
            "total_trades": len([t for t in self.trade_history if t["type"] == "EXIT"]),
            "risk_metrics": {
                "max_risk_per_trade": self.max_risk_per_trade,
                "max_portfolio_risk": self.max_portfolio_risk,
                "stop_loss_percent": self.stop_loss_percent,
                "take_profit_percent": self.take_profit_percent
            }
        }
    
    def add_to_blacklist(self, symbol: str, reason: str = "Manual"):
        """Add a stock to the blacklist"""
        self.blacklisted_stocks.add(symbol.upper())
        print(f"🚫 Added {symbol} to blacklist. Reason: {reason}")
    
    def remove_from_blacklist(self, symbol: str):
        """Remove a stock from blacklist"""
        self.blacklisted_stocks.discard(symbol.upper())
        print(f"✅ Removed {symbol} from blacklist")
    
    def adjust_risk_settings(self, **kwargs):
        """Adjust risk management settings"""
        for setting, value in kwargs.items():
            if hasattr(self, setting):
                old_value = getattr(self, setting)
                setattr(self, setting, value)
                print(f"🔧 Updated {setting}: {old_value} → {value}")
            else:
                print(f"❌ Unknown setting: {setting}")

# Example usage
if __name__ == "__main__":
    print("🛡️ Testing Risk Management System...")
    
    # Create risk manager with $10,000 fake money
    risk_manager = RiskManager(initial_balance=10000)
    
    # Example prediction from our AI
    fake_prediction = {
        "symbol": "AAPL",
        "current_price": 150.00,
        "predicted_price": 160.00,
        "percent_change": 6.67,
        "confidence": 0.75,
        "signal": "BUY"
    }
    
    # Test entering a position
    result = risk_manager.enter_position(fake_prediction)
    print(f"Trade result: {result}")
    
    # Get portfolio summary
    summary = risk_manager.get_portfolio_summary()
    print(f"Portfolio summary: {summary}")
