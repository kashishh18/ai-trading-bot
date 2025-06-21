import asyncio
import aiohttp
import json
from datetime import datetime
from typing import Dict, Optional
import os

class DiscordNotifier:
    """
    Send cool trading alerts to your Discord server! 🤖💬
    Makes your trading bot feel like a real Wall Street operation!
    """
    
    def __init__(self, webhook_url: Optional[str] = None):
        # You'll get this webhook URL from Discord (super easy!)
        self.webhook_url = webhook_url or os.getenv('DISCORD_WEBHOOK_URL')
        self.enabled = bool(self.webhook_url)
        
        if not self.enabled:
            print("💬 Discord notifications disabled - no webhook URL provided")
        else:
            print("💬 Discord notifications enabled! 🚀")
    
    async def send_embed(self, embed_data: Dict):
        """Send a fancy embedded message to Discord"""
        if not self.enabled:
            return False
            
        try:
            async with aiohttp.ClientSession() as session:
                payload = {
                    "embeds": [embed_data],
                    "username": "AI Trading Bot 🤖",
                    "avatar_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
                }
                
                async with session.post(self.webhook_url, json=payload) as response:
                    if response.status == 204:
                        print("✅ Discord notification sent successfully!")
                        return True
                    else:
                        print(f"❌ Discord notification failed: {response.status}")
                        return False
                        
        except Exception as e:
            print(f"❌ Discord notification error: {e}")
            return False
    
    async def send_trade_alert(self, trade_data: Dict):
        """Send a trade execution alert"""
        signal = trade_data.get('signal', 'UNKNOWN')
        symbol = trade_data.get('symbol', 'UNKNOWN')
        price = trade_data.get('price', 0)
        shares = trade_data.get('shares', 0)
        confidence = trade_data.get('confidence', 0)
        amount = trade_data.get('amount', 0)
        
        # Choose color based on trade type
        if signal == 'BUY':
            color = 0x00ff41  # Bright green
            emoji = "📈"
            action = "BOUGHT"
        elif signal == 'SELL':
            color = 0xff4757  # Bright red  
            emoji = "📉"
            action = "SOLD"
        else:
            color = 0xffa502  # Orange
            emoji = "⚡"
            action = "TRADED"
        
        embed = {
            "title": f"{emoji} Trade Executed!",
            "description": f"**{action} {symbol}**",
            "color": color,
            "fields": [
                {
                    "name": "💰 Price",
                    "value": f"${price:.2f}",
                    "inline": True
                },
                {
                    "name": "📊 Shares",
                    "value": f"{shares:,}",
                    "inline": True
                },
                {
                    "name": "💵 Total Amount",
                    "value": f"${amount:,.2f}",
                    "inline": True
                },
                {
                    "name": "🧠 AI Confidence",
                    "value": f"{confidence*100:.1f}%",
                    "inline": True
                },
                {
                    "name": "🎯 Signal Type",
                    "value": signal,
                    "inline": True
                },
                {
                    "name": "⏰ Time",
                    "value": datetime.now().strftime("%H:%M:%S"),
                    "inline": True
                }
            ],
            "footer": {
                "text": "AI Trading Bot • Making money while you sleep 💰",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_embed(embed)
    
    async def send_opportunity_alert(self, opportunities: list):
        """Send new trading opportunities"""
        if not opportunities:
            return
            
        embed = {
            "title": "🎯 New Trading Opportunities Found!",
            "description": f"AI discovered **{len(opportunities)}** potential trades",
            "color": 0x3742fa,  # Blue
            "fields": [],
            "footer": {
                "text": "AI Trading Bot • Opportunity Scanner",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        # Add top 3 opportunities
        for i, opp in enumerate(opportunities[:3]):
            symbol = opp.get('symbol', 'UNKNOWN')
            signal = opp.get('signal', 'HOLD')
            confidence = opp.get('confidence', 0)
            expected_change = opp.get('percent_change', 0)
            
            signal_emoji = "📈" if signal == "BUY" else "📉" if signal == "SELL" else "➡️"
            
            embed["fields"].append({
                "name": f"{signal_emoji} #{i+1}: {symbol}",
                "value": f"**{signal}** • {confidence*100:.1f}% confidence\nExpected: {expected_change:+.2f}%",
                "inline": True
            })
        
        if len(opportunities) > 3:
            embed["fields"].append({
                "name": "📋 More Opportunities",
                "value": f"...and {len(opportunities)-3} more in the dashboard!",
                "inline": False
            })
        
        await self.send_embed(embed)
    
    async def send_position_closed(self, position_data: Dict):
        """Send position closure alert"""
        symbol = position_data.get('symbol', 'UNKNOWN')
        pnl = position_data.get('pnl', 0)
        reason = position_data.get('reason', 'Unknown reason')
        entry_price = position_data.get('entry_price', 0)
        exit_price = position_data.get('exit_price', 0)
        shares = position_data.get('shares', 0)
        days_held = position_data.get('days_held', 0)
        
        # Color based on profit/loss
        if pnl > 0:
            color = 0x00ff41  # Green for profit
            emoji = "💰"
            result = "PROFIT"
        elif pnl < 0:
            color = 0xff4757  # Red for loss
            emoji = "💸"
            result = "LOSS"
        else:
            color = 0x95a5a6  # Gray for breakeven
            emoji = "➖"
            result = "BREAKEVEN"
        
        embed = {
            "title": f"{emoji} Position Closed: {symbol}",
            "description": f"**{result}**: {pnl:+.2f} USD",
            "color": color,
            "fields": [
                {
                    "name": "📊 Entry Price",
                    "value": f"${entry_price:.2f}",
                    "inline": True
                },
                {
                    "name": "📊 Exit Price", 
                    "value": f"${exit_price:.2f}",
                    "inline": True
                },
                {
                    "name": "📈 Shares",
                    "value": f"{shares:,}",
                    "inline": True
                },
                {
                    "name": "💰 P&L",
                    "value": f"${pnl:+,.2f}",
                    "inline": True
                },
                {
                    "name": "📅 Days Held",
                    "value": f"{days_held} days",
                    "inline": True
                },
                {
                    "name": "📋 Reason",
                    "value": reason,
                    "inline": True
                }
            ],
            "footer": {
                "text": "AI Trading Bot • Position Manager",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_embed(embed)
    
    async def send_daily_summary(self, summary_data: Dict):
        """Send end of day portfolio summary"""
        total_value = summary_data.get('total_value', 0)
        daily_change = summary_data.get('daily_change', 0)
        daily_change_percent = summary_data.get('daily_change_percent', 0)
        positions = summary_data.get('positions', 0)
        trades_today = summary_data.get('trades_today', 0)
        
        # Color based on daily performance
        if daily_change > 0:
            color = 0x00ff41  # Green
            emoji = "📈"
            trend = "UP"
        elif daily_change < 0:
            color = 0xff4757  # Red
            emoji = "📉"
            trend = "DOWN"
        else:
            color = 0x95a5a6  # Gray
            emoji = "➖"
            trend = "FLAT"
        
        embed = {
            "title": f"{emoji} Daily Portfolio Summary",
            "description": f"Portfolio is **{trend}** today",
            "color": color,
            "fields": [
                {
                    "name": "💼 Total Value",
                    "value": f"${total_value:,.2f}",
                    "inline": True
                },
                {
                    "name": "📊 Daily Change",
                    "value": f"${daily_change:+,.2f} ({daily_change_percent:+.2f}%)",
                    "inline": True
                },
                {
                    "name": "🎯 Active Positions",
                    "value": f"{positions} stocks",
                    "inline": True
                },
                {
                    "name": "⚡ Trades Today",
                    "value": f"{trades_today} executed",
                    "inline": True
                },
                {
                    "name": "🤖 AI Status",
                    "value": "✅ Active & Learning",
                    "inline": True
                },
                {
                    "name": "📅 Date",
                    "value": datetime.now().strftime("%B %d, %Y"),
                    "inline": True
                }
            ],
            "footer": {
                "text": "AI Trading Bot • Daily Report",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_embed(embed)
    
    async def send_error_alert(self, error_message: str, error_type: str = "General Error"):
        """Send error/warning alerts"""
        embed = {
            "title": "⚠️ Trading Bot Alert",
            "description": f"**{error_type}**",
            "color": 0xff6b6b,  # Light red
            "fields": [
                {
                    "name": "❌ Error Details",
                    "value": error_message[:1000],  # Limit length
                    "inline": False
                },
                {
                    "name": "⏰ Time",
                    "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "inline": True
                },
                {
                    "name": "🔧 Action Required",
                    "value": "Check the trading dashboard for more details",
                    "inline": True
                }
            ],
            "footer": {
                "text": "AI Trading Bot • Error Monitor",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_embed(embed)
    
    async def send_startup_message(self):
        """Send a message when the bot starts up"""
        embed = {
            "title": "🚀 AI Trading Bot Started!",
            "description": "Your money-making machine is now online and ready to trade!",
            "color": 0x2ed573,  # Bright green
            "fields": [
                {
                    "name": "⚡ Status",
                    "value": "✅ All systems operational",
                    "inline": True
                },
                {
                    "name": "🧠 AI Model",
                    "value": "✅ Loaded and ready",
                    "inline": True
                },
                {
                    "name": "📊 Market Data",
                    "value": "✅ Connected to feeds",
                    "inline": True
                },
                {
                    "name": "🛡️ Risk Management",
                    "value": "✅ Active protection",
                    "inline": True
                },
                {
                    "name": "💰 Portfolio",
                    "value": "✅ Ready for trading",
                    "inline": True
                },
                {
                    "name": "🎯 Watchlist",
                    "value": "✅ Scanning opportunities",
                    "inline": True
                }
            ],
            "footer": {
                "text": "AI Trading Bot • System Status",
                "icon_url": "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"
            },
            "timestamp": datetime.now().isoformat()
        }
        
        await self.send_embed(embed)
    
    def send_trade_sync(self, trade_data: Dict):
        """Synchronous wrapper for trade alerts"""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, schedule it
                asyncio.create_task(self.send_trade_alert(trade_data))
            else:
                # If not in async context, run it
                loop.run_until_complete(self.send_trade_alert(trade_data))
        except Exception as e:
            print(f"Error sending Discord notification: {e}")

# Global instance (initialized when you set the webhook URL)
discord_notifier = DiscordNotifier()

# Easy functions to use throughout your app
def notify_trade(trade_data: Dict):
    """Quick function to notify about trades"""
    if discord_notifier.enabled:
        discord_notifier.send_trade_sync(trade_data)

def notify_opportunity(opportunities: list):
    """Quick function to notify about opportunities"""
    if discord_notifier.enabled:
        asyncio.create_task(discord_notifier.send_opportunity_alert(opportunities))

def notify_position_closed(position_data: Dict):
    """Quick function to notify about closed positions"""
    if discord_notifier.enabled:
        asyncio.create_task(discord_notifier.send_position_closed(position_data))

def notify_error(error_message: str, error_type: str = "General Error"):
    """Quick function to notify about errors"""
    if discord_notifier.enabled:
        asyncio.create_task(discord_notifier.send_error_alert(error_message, error_type))

# Example usage:
if __name__ == "__main__":
    # Test the Discord notifications
    print("🧪 Testing Discord notifications...")
    
    # Example trade data
    test_trade = {
        'symbol': 'AAPL',
        'signal': 'BUY',
        'price': 150.25,
        'shares': 50,
        'confidence': 0.78,
        'amount': 7512.50
    }
    
    # Example opportunities
    test_opportunities = [
        {'symbol': 'TSLA', 'signal': 'BUY', 'confidence': 0.85, 'percent_change': 5.4},
        {'symbol': 'MSFT', 'signal': 'BUY', 'confidence': 0.72, 'percent_change': 3.2},
        {'symbol': 'GOOGL', 'signal': 'SELL', 'confidence': 0.68, 'percent_change': -2.1}
    ]
    
    async def test_notifications():
        notifier = DiscordNotifier("YOUR_WEBHOOK_URL_HERE")  # Replace with real URL
        
        await notifier.send_startup_message()
        await asyncio.sleep(1)
        
        await notifier.send_trade_alert(test_trade)
        await asyncio.sleep(1)
        
        await notifier.send_opportunity_alert(test_opportunities)
        await asyncio.sleep(1)
        
        await notifier.send_daily_summary({
            'total_value': 105780.50,
            'daily_change': 2340.75,
            'daily_change_percent': 2.25,
            'positions': 8,
            'trades_today': 3
        })
    
    # Uncomment to test:
    # asyncio.run(test_notifications())
