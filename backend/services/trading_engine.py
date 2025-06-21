import asyncio
import json
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import logging
from concurrent.futures import ThreadPoolExecutor
import threading

# Import our custom modules
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.ml_models import StockPredictor, MultiStockPredictor
from models.risk_manager import RiskManager
from services.market_data import MarketDataService
from database.db_manager import DatabaseManager

# ADD THIS: Discord integration import
from integrations.discord_bot import discord_notifier, notify_trade, notify_opportunity, notify_position_closed, notify_error

class TradingEngine:
    """
    This is the MASTER BRAIN! 🧠⚡
    It combines AI predictions, risk management, and market data
    to make smart trading decisions automatically!
    
    NOW WITH DISCORD NOTIFICATIONS! 💬🚀
    """
    
    def __init__(self, initial_balance: float = 100000, auto_trade: bool = False):
        """Initialize the trading engine"""
        print("🚀 Initializing AI Trading Engine...")
        
        # Core components
        self.market_data = MarketDataService()
        self.risk_manager = RiskManager(initial_balance)
        self.db_manager = DatabaseManager()
        self.multi_predictor = MultiStockPredictor()
        
        # Settings
        self.auto_trade = auto_trade
        self.is_running = False
        self.trading_hours = {'start': 9, 'end': 16}  # 9 AM to 4 PM EST
        self.scan_interval = 300  # Check every 5 minutes
        
        # Watchlist - stocks we want to monitor
        self.watchlist = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA',
            'NFLX', 'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL'
        ]
        
        # Performance tracking
        self.trading_stats = {
            'total_signals': 0,
            'successful_trades': 0,
            'failed_trades': 0,
            'total_profit': 0.0,
            'start_time': datetime.now(),
            'last_scan': None
        }
        
        # Alerts and notifications
        self.alerts = []
        self.max_alerts = 100
        
        print("✅ Trading Engine initialized!")
        print(f"💰 Starting balance: ${initial_balance:,.2f}")
        print(f"🤖 Auto-trading: {'ON' if auto_trade else 'OFF'}")
        print(f"👀 Watching {len(self.watchlist)} stocks")
        print(f"💬 Discord notifications: {'ON' if discord_notifier.enabled else 'OFF'}")
    
    def add_alert(self, alert_type: str, message: str, symbol: str = None):
        """Add an alert/notification"""
        alert = {
            'type': alert_type,
            'message': message,
            'symbol': symbol,
            'timestamp': datetime.now().isoformat(),
            'id': len(self.alerts)
        }
        
        self.alerts.append(alert)
        
        # Keep only recent alerts
        if len(self.alerts) > self.max_alerts:
            self.alerts = self.alerts[-self.max_alerts:]
        
        print(f"🔔 {alert_type}: {message}")
        
        # ADD THIS: Send Discord notification for errors
        if alert_type == 'ERROR':
            notify_error(message, "Trading Engine Error")
    
    def is_market_open(self) -> bool:
        """Check if the market is open (simple version)"""
        now = datetime.now()
        
        # Check if it's a weekday
        if now.weekday() >= 5:  # Saturday = 5, Sunday = 6
            return False
        
        # Check trading hours (simplified - doesn't account for holidays)
        current_hour = now.hour
        return self.trading_hours['start'] <= current_hour < self.trading_hours['end']
    
    def scan_for_opportunities(self) -> List[Dict]:
        """Scan all watchlist stocks for trading opportunities"""
        print(f"🔍 Scanning {len(self.watchlist)} stocks for opportunities...")
        
        opportunities = []
        
        # Get current market data for all stocks
        market_data = self.market_data.get_multiple_stocks(self.watchlist)
        
        for symbol in self.watchlist:
            try:
                # Skip if we couldn't get market data
                if symbol not in market_data:
                    continue
                
                # Get AI prediction
                if symbol not in self.multi_predictor.predictors:
                    self.multi_predictor.add_stock(symbol)
                
                predictor = self.multi_predictor.predictors[symbol]
                
                # Train model if not trained or if model is old
                if (predictor.model is None or 
                    predictor.last_trained is None or 
                    (datetime.now() - predictor.last_trained).days > 7):
                    
                    print(f"🎓 Training AI model for {symbol}...")
                    success = predictor.train_model("RandomForest")
                    if not success:
                        print(f"❌ Failed to train model for {symbol}")
                        continue
                
                # Get prediction
                prediction = predictor.predict_next_price()
                if not prediction:
                    continue
                
                # Check if this is a good opportunity
                should_trade, reason = self.risk_manager.should_enter_trade(prediction)
                
                if should_trade:
                    # Calculate potential position details
                    position_info = self.risk_manager.calculate_position_size(
                        symbol, 
                        prediction['current_price'], 
                        prediction['confidence']
                    )
                    
                    if position_info.get('position_valid', False):
                        opportunity = {
                            **prediction,
                            'position_info': position_info,
                            'market_data': market_data[symbol],
                            'scan_time': datetime.now().isoformat(),
                            'reason': reason
                        }
                        opportunities.append(opportunity)
                        
                        self.add_alert(
                            'OPPORTUNITY', 
                            f"{symbol}: {prediction['signal']} signal with {prediction['confidence']:.1%} confidence",
                            symbol
                        )
                
            except Exception as e:
                error_msg = f"Error scanning {symbol}: {e}"
                print(f"❌ {error_msg}")
                self.add_alert('ERROR', error_msg, symbol)
                continue
        
        # Sort opportunities by confidence and expected return
        opportunities.sort(
            key=lambda x: (x['confidence'] * abs(x['percent_change'])), 
            reverse=True
        )
        
        self.trading_stats['last_scan'] = datetime.now()
        print(f"✅ Found {len(opportunities)} trading opportunities")
        
        # ADD THIS: Send Discord notification about opportunities
        if opportunities:
            try:
                notify_opportunity(opportunities[:5])  # Send top 5 opportunities
            except Exception as e:
                print(f"⚠️ Failed to send Discord opportunity notification: {e}")
        
        return opportunities
    
    def execute_trade(self, opportunity: Dict) -> Dict:
        """Execute a trading opportunity"""
        symbol = opportunity['symbol']
        
        try:
            print(f"⚡ Executing trade for {symbol}...")
            
            # Double-check market data is fresh
            current_data = self.market_data.get_current_price(symbol)
            if not current_data:
                return {
                    'success': False,
                    'symbol': symbol,
                    'error': 'Could not get current price'
                }
            
            # Update prediction with current price
            opportunity['current_price'] = current_data['current_price']
            
            # Execute through risk manager
            trade_result = self.risk_manager.enter_position(opportunity)
            
            if trade_result['success']:
                # Save to database
                self.db_manager.save_prediction(
                    symbol,
                    opportunity['predicted_price'],
                    opportunity['current_price'],
                    opportunity['confidence']
                )
                
                self.db_manager.save_trading_signal(
                    symbol,
                    opportunity['signal'],
                    opportunity['confidence'],
                    opportunity['current_price'],
                    f"AI prediction: {opportunity['percent_change']:.2f}% expected return"
                )
                
                # Update stats
                self.trading_stats['total_signals'] += 1
                
                self.add_alert(
                    'TRADE_EXECUTED',
                    f"✅ {opportunity['signal']} {symbol} @ ${opportunity['current_price']} "
                    f"({trade_result['position']['shares']} shares)",
                    symbol
                )
                
                # ADD THIS: Send Discord notification about successful trade
                try:
                    discord_trade_data = {
                        'symbol': symbol,
                        'signal': opportunity['signal'],
                        'price': opportunity['current_price'], 
                        'shares': trade_result['position']['shares'],
                        'confidence': opportunity['confidence'],
                        'amount': trade_result['position']['investment_amount']
                    }
                    notify_trade(discord_trade_data)
                except Exception as e:
                    print(f"⚠️ Failed to send Discord trade notification: {e}")
                
                return {
                    'success': True,
                    'symbol': symbol,
                    'trade_result': trade_result,
                    'opportunity': opportunity
                }
            
            else:
                self.add_alert(
                    'TRADE_REJECTED',
                    f"❌ Trade rejected for {symbol}: {trade_result['reason']}",
                    symbol
                )
                
                return {
                    'success': False,
                    'symbol': symbol,
                    'reason': trade_result['reason']
                }
        
        except Exception as e:
            error_msg = f"Error executing trade for {symbol}: {e}"
            print(f"❌ {error_msg}")
            self.add_alert('ERROR', error_msg, symbol)
            
            return {
                'success': False,
                'symbol': symbol,
                'error': str(e)
            }
    
    def update_positions(self) -> Dict:
        """Update all current positions and check for exits"""
        print("📊 Updating all positions...")
        
        try:
            # Update positions through risk manager
            update_result = self.risk_manager.update_positions()
            
            # Log any position exits
            if 'updated_positions' in update_result:
                for position_update in update_result['updated_positions']:
                    if position_update['action'] == 'EXITED':
                        symbol = position_update['symbol']
                        pnl = position_update.get('pnl', 0)
                        reason = position_update.get('reason', 'Unknown')
                        
                        self.add_alert(
                            'POSITION_CLOSED',
                            f"🔄 Closed {symbol}: ${pnl:.2f} P&L - {reason}",
                            symbol
                        )
                        
                        # Update stats
                        if pnl > 0:
                            self.trading_stats['successful_trades'] += 1
                        else:
                            self.trading_stats['failed_trades'] += 1
                        
                        self.trading_stats['total_profit'] += pnl
                        
                        # ADD THIS: Send Discord notification about closed position
                        try:
                            # Get position details from risk manager portfolio
                            if symbol in self.risk_manager.portfolio:
                                position = self.risk_manager.portfolio[symbol]
                                discord_position_data = {
                                    'symbol': symbol,
                                    'pnl': pnl,
                                    'reason': reason,
                                    'entry_price': position.get('entry_price', 0),
                                    'exit_price': position.get('current_price', 0),
                                    'shares': position.get('shares', 0),
                                    'days_held': (datetime.now() - datetime.fromisoformat(position.get('entry_date', datetime.now().isoformat()))).days
                                }
                                notify_position_closed(discord_position_data)
                        except Exception as e:
                            print(f"⚠️ Failed to send Discord position closed notification: {e}")
            
            return update_result
            
        except Exception as e:
            error_msg = f"Error updating positions: {e}"
            print(f"❌ {error_msg}")
            self.add_alert('ERROR', error_msg)
            return {'error': str(e)}
    
    def get_portfolio_status(self) -> Dict:
        """Get comprehensive portfolio status"""
        try:
            # Get portfolio summary from risk manager
            portfolio_summary = self.risk_manager.get_portfolio_summary()
            
            # Add trading engine stats
            portfolio_summary['engine_stats'] = self.trading_stats.copy()
            
            # Calculate uptime
            uptime = datetime.now() - self.trading_stats['start_time']
            portfolio_summary['engine_stats']['uptime_hours'] = round(uptime.total_seconds() / 3600, 2)
            
            # Calculate success rate
            total_completed_trades = (
                self.trading_stats['successful_trades'] + 
                self.trading_stats['failed_trades']
            )
            
            if total_completed_trades > 0:
                success_rate = (self.trading_stats['successful_trades'] / total_completed_trades) * 100
                portfolio_summary['engine_stats']['success_rate'] = round(success_rate, 2)
            else:
                portfolio_summary['engine_stats']['success_rate'] = 0
            
            # Add market status
            portfolio_summary['market_open'] = self.is_market_open()
            portfolio_summary['engine_running'] = self.is_running
            
            return portfolio_summary
            
        except Exception as e:
            return {'error': f"Error getting portfolio status: {e}"}
    
    def get_top_predictions(self, limit: int = 5) -> List[Dict]:
        """Get top AI predictions across all watchlist stocks"""
        try:
            print(f"🔮 Getting top {limit} AI predictions...")
            
            predictions = []
            
            # Get predictions for all stocks
            for symbol in self.watchlist:
                if symbol not in self.multi_predictor.predictors:
                    self.multi_predictor.add_stock(symbol)
                
                predictor = self.multi_predictor.predictors[symbol]
                
                # Skip if model not trained
                if predictor.model is None:
                    continue
                
                prediction = predictor.predict_next_price()
                if prediction and prediction.get('confidence', 0) > 0.5:
                    predictions.append(prediction)
            
            # Sort by confidence * expected return
            predictions.sort(
                key=lambda x: x['confidence'] * abs(x['percent_change']),
                reverse=True
            )
            
            return predictions[:limit]
            
        except Exception as e:
            print(f"❌ Error getting predictions: {e}")
            return []
    
    async def run_trading_cycle(self):
        """Run one complete trading cycle"""
        try:
            print(f"\n🔄 Running trading cycle at {datetime.now().strftime('%H:%M:%S')}")
            
            # Check if market is open
            if not self.is_market_open():
                print("🕐 Market is closed, skipping trading cycle")
                return
            
            # Update existing positions first
            await asyncio.get_event_loop().run_in_executor(
                None, self.update_positions
            )
            
            # Scan for new opportunities
            opportunities = await asyncio.get_event_loop().run_in_executor(
                None, self.scan_for_opportunities
            )
            
            # Execute trades if auto-trading is enabled
            if self.auto_trade and opportunities:
                print(f"🤖 Auto-trading enabled, executing top {min(3, len(opportunities))} opportunities...")
                
                for opportunity in opportunities[:3]:  # Execute top 3 opportunities
                    trade_result = await asyncio.get_event_loop().run_in_executor(
                        None, self.execute_trade, opportunity
                    )
                    
                    if trade_result['success']:
                        print(f"✅ Successfully executed trade for {opportunity['symbol']}")
                    else:
                        print(f"❌ Failed to execute trade for {opportunity['symbol']}")
                    
                    # Small delay between trades
                    await asyncio.sleep(2)
            
            elif opportunities:
                print(f"💡 Found {len(opportunities)} opportunities (auto-trading disabled)")
                for opp in opportunities[:3]:
                    print(f"   {opp['symbol']}: {opp['signal']} ({opp['confidence']:.1%} confidence)")
            
            print("✅ Trading cycle completed")
            
        except Exception as e:
            error_msg = f"Error in trading cycle: {e}"
            print(f"❌ {error_msg}")
            self.add_alert('ERROR', error_msg)
    
    async def start_engine(self):
        """Start the main trading engine loop"""
        if self.is_running:
            print("⚠️ Trading engine is already running!")
            return
        
        self.is_running = True
        print("🚀 Starting AI Trading Engine...")
        
        self.add_alert('ENGINE_START', 'AI Trading Engine started')
        
        # ADD THIS: Send Discord startup notification
        try:
            if discord_notifier.enabled:
                await discord_notifier.send_startup_message()
        except Exception as e:
            print(f"⚠️ Failed to send Discord startup notification: {e}")
        
        try:
            while self.is_running:
                await self.run_trading_cycle()
                
                # Wait for next cycle
                print(f"⏰ Waiting {self.scan_interval} seconds until next scan...")
                await asyncio.sleep(self.scan_interval)
                
        except KeyboardInterrupt:
            print("\n🛑 Received stop signal...")
        except Exception as e:
            error_msg = f"Engine error: {e}"
            print(f"❌ {error_msg}")
            self.add_alert('ERROR', error_msg)
        finally:
            self.is_running = False
            self.add_alert('ENGINE_STOP', 'AI Trading Engine stopped')
            print("🛑 Trading Engine stopped")
    
    def stop_engine(self):
        """Stop the trading engine"""
        print("🛑 Stopping Trading Engine...")
        self.is_running = False
    
    def manual_trade(self, symbol: str) -> Dict:
        """Manually trigger a trade for a specific symbol"""
        try:
            print(f"👨‍💼 Manual trade requested for {symbol}")
            
            # Add to multi-predictor if not already there
            if symbol not in self.multi_predictor.predictors:
                self.multi_predictor.add_stock(symbol)
            
            predictor = self.multi_predictor.predictors[symbol]
            
            # Train model if needed
            if predictor.model is None:
                print(f"🎓 Training model for {symbol}...")
                success = predictor.train_model("RandomForest")
                if not success:
                    return {'success': False, 'error': f'Failed to train model for {symbol}'}
            
            # Get prediction
            prediction = predictor.predict_next_price()
            if not prediction:
                return {'success': False, 'error': f'Failed to get prediction for {symbol}'}
            
            # Execute trade
            result = self.execute_trade(prediction)
            
            return result
            
        except Exception as e:
            error_msg = f"Manual trade error for {symbol}: {e}"
            self.add_alert('ERROR', error_msg, symbol)
            return {'success': False, 'error': str(e)}
    
    def get_recent_alerts(self, limit: int = 20) -> List[Dict]:
        """Get recent alerts"""
        return self.alerts[-limit:] if self.alerts else []
    
    def get_engine_status(self) -> Dict:
        """Get comprehensive engine status"""
        return {
            'is_running': self.is_running,
            'auto_trade': self.auto_trade,
            'market_open': self.is_market_open(),
            'watchlist_size': len(self.watchlist),
            'scan_interval': self.scan_interval,
            'trading_stats': self.trading_stats,
            'portfolio_summary': self.risk_manager.get_portfolio_summary(),
            'recent_alerts': self.get_recent_alerts(10),
            'cache_stats': self.market_data.get_cache_stats(),
            'discord_enabled': discord_notifier.enabled  # ADD THIS: Show Discord status
        }
    
    async def send_daily_summary(self):
        """Send end-of-day portfolio summary to Discord"""
        try:
            if not discord_notifier.enabled:
                return
                
            portfolio_summary = self.get_portfolio_status()
            
            # Calculate daily change (simplified - you might want to track this better)
            total_value = portfolio_summary.get('total_value', 0)
            total_return = portfolio_summary.get('total_return', 0)
            positions = portfolio_summary.get('number_of_positions', 0)
            
            # Count today's trades
            trades_today = len([
                alert for alert in self.alerts 
                if alert['type'] == 'TRADE_EXECUTED' 
                and alert['timestamp'].startswith(datetime.now().strftime('%Y-%m-%d'))
            ])
            
            summary_data = {
                'total_value': total_value,
                'daily_change': total_return,  # Simplified
                'daily_change_percent': portfolio_summary.get('total_return_percent', 0),
                'positions': positions,
                'trades_today': trades_today
            }
            
            await discord_notifier.send_daily_summary(summary_data)
            
        except Exception as e:
            print(f"⚠️ Failed to send Discord daily summary: {e}")

# Example usage
if __name__ == "__main__":
    print("🧪 Testing Trading Engine with Discord integration...")
    
    # Create trading engine with $10,000 fake money
    engine = TradingEngine(initial_balance=10000, auto_trade=False)
    
    # Test manual trade
    print("\n💼 Testing manual trade for AAPL...")
    result = engine.manual_trade("AAPL")
    print(f"Manual trade result: {result}")
    
    # Test scanning for opportunities
    print("\n🔍 Testing opportunity scanning...")
    opportunities = engine.scan_for_opportunities()
    print(f"Found {len(opportunities)} opportunities")
    
    # Test getting portfolio status
    print("\n📊 Testing portfolio status...")
    status = engine.get_portfolio_status()
    print(f"Portfolio value: ${status.get('total_value', 0):,.2f}")
    print(f"Discord enabled: {status.get('discord_enabled', False)}")
    
    # Test getting top predictions
    print("\n🔮 Testing top predictions...")
    predictions = engine.get_top_predictions(3)
    for pred in predictions:
        print(f"   {pred['symbol']}: {pred['percent_change']:+.2f}% ({pred['confidence']:.1%})")
    
    print("\n✅ Trading Engine test completed!")
    print("💬 Discord notifications will work when you set up the webhook URL!")
