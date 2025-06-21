import yfinance as yf
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import requests
import time
from typing import Dict, List, Optional, Union
import json
from concurrent.futures import ThreadPoolExecutor, as_completed
import warnings
warnings.filterwarnings('ignore')

class MarketDataService:
    """
    This is your FREE stock data superhero! 🦸‍♂️📊
    It gets real-time stock prices, news, and market info without paying a penny!
    """
    
    def __init__(self):
        self.cache = {}  # Store data temporarily to avoid repeat requests
        self.cache_duration = 300  # Cache for 5 minutes
        self.popular_stocks = [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
            'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'UBER', 'SPOT',
            'ZM', 'SHOP', 'SQ', 'ROKU', 'SNAP', 'TWTR', 'COIN', 'RBLX'
        ]
        
    def get_stock_data(self, symbol: str, period: str = "1d", interval: str = "1m") -> Optional[pd.DataFrame]:
        """
        Get stock price data - this is 100% FREE! 🎉
        
        Args:
            symbol: Stock symbol (like 'AAPL')
            period: How far back to go ('1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max')
            interval: Data frequency ('1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo')
        """
        try:
            cache_key = f"{symbol}_{period}_{interval}"
            
            # Check if we have recent data in cache
            if cache_key in self.cache:
                cached_data, timestamp = self.cache[cache_key]
                if time.time() - timestamp < self.cache_duration:
                    return cached_data
            
            print(f"📡 Fetching {symbol} data for {period} period...")
            
            # Get data from Yahoo Finance (FREE!)
            ticker = yf.Ticker(symbol)
            data = ticker.history(period=period, interval=interval)
            
            if data.empty:
                print(f"❌ No data found for {symbol}")
                return None
            
            # Cache the data
            self.cache[cache_key] = (data, time.time())
            
            print(f"✅ Got {len(data)} data points for {symbol}")
            return data
            
        except Exception as e:
            print(f"❌ Error fetching data for {symbol}: {e}")
            return None
    
    def get_current_price(self, symbol: str) -> Optional[Dict]:
        """Get current stock price and basic info"""
        try:
            ticker = yf.Ticker(symbol)
            
            # Get current data
            current_data = ticker.history(period="1d", interval="1m")
            if current_data.empty:
                return None
            
            # Get basic info
            info = ticker.info
            
            # Calculate price change
            latest_price = current_data['Close'].iloc[-1]
            open_price = current_data['Open'].iloc[0]
            price_change = latest_price - open_price
            percent_change = (price_change / open_price) * 100
            
            return {
                "symbol": symbol.upper(),
                "current_price": round(float(latest_price), 2),
                "open_price": round(float(open_price), 2),
                "price_change": round(float(price_change), 2),
                "percent_change": round(float(percent_change), 2),
                "volume": int(current_data['Volume'].iloc[-1]),
                "high_24h": round(float(current_data['High'].max()), 2),
                "low_24h": round(float(current_data['Low'].min()), 2),
                "market_cap": info.get('marketCap', 'N/A'),
                "pe_ratio": info.get('trailingPE', 'N/A'),
                "company_name": info.get('longName', symbol),
                "sector": info.get('sector', 'N/A'),
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error getting current price for {symbol}: {e}")
            return None
    
    def get_multiple_stocks(self, symbols: List[str]) -> Dict[str, Dict]:
        """Get data for multiple stocks at once - super fast! ⚡"""
        results = {}
        
        # Use threading to get multiple stocks simultaneously
        with ThreadPoolExecutor(max_workers=10) as executor:
            # Submit all requests
            future_to_symbol = {
                executor.submit(self.get_current_price, symbol): symbol 
                for symbol in symbols
            }
            
            # Collect results as they complete
            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                try:
                    result = future.result()
                    if result:
                        results[symbol] = result
                except Exception as e:
                    print(f"❌ Error getting data for {symbol}: {e}")
        
        return results
    
    def get_trending_stocks(self) -> List[Dict]:
        """Get today's trending/most active stocks"""
        try:
            print("🔥 Getting trending stocks...")
            
            # Get data for popular stocks
            trending_data = self.get_multiple_stocks(self.popular_stocks)
            
            # Sort by volume and price change
            trending_list = []
            for symbol, data in trending_data.items():
                if data and 'volume' in data and 'percent_change' in data:
                    trending_list.append({
                        'symbol': symbol,
                        'price': data['current_price'],
                        'change': data['percent_change'],
                        'volume': data['volume'],
                        'company': data.get('company_name', symbol)
                    })
            
            # Sort by absolute percent change (biggest movers)
            trending_list.sort(key=lambda x: abs(x['change']), reverse=True)
            
            return trending_list[:10]  # Top 10 trending
            
        except Exception as e:
            print(f"❌ Error getting trending stocks: {e}")
            return []
    
    def get_market_summary(self) -> Dict:
        """Get overall market summary (S&P 500, NASDAQ, DOW)"""
        try:
            print("📈 Getting market summary...")
            
            market_indices = {
                '^GSPC': 'S&P 500',
                '^IXIC': 'NASDAQ',
                '^DJI': 'Dow Jones',
                '^VIX': 'VIX (Fear Index)'
            }
            
            summary = {}
            
            for symbol, name in market_indices.items():
                data = self.get_current_price(symbol)
                if data:
                    summary[name] = {
                        'price': data['current_price'],
                        'change': data['price_change'],
                        'percent_change': data['percent_change']
                    }
            
            # Add some market insights
            if 'S&P 500' in summary:
                sp500_change = summary['S&P 500']['percent_change']
                if sp500_change > 1:
                    market_mood = "🟢 Bullish"
                elif sp500_change < -1:
                    market_mood = "🔴 Bearish"
                else:
                    market_mood = "🟡 Neutral"
                
                summary['market_mood'] = market_mood
            
            summary['timestamp'] = datetime.now().isoformat()
            return summary
            
        except Exception as e:
            print(f"❌ Error getting market summary: {e}")
            return {}
    
    def get_sector_performance(self) -> Dict:
        """Get performance of different market sectors"""
        try:
            print("🏭 Getting sector performance...")
            
            sector_etfs = {
                'XLK': 'Technology',
                'XLF': 'Financial',
                'XLV': 'Healthcare',
                'XLE': 'Energy',
                'XLI': 'Industrial',
                'XLC': 'Communication',
                'XLY': 'Consumer Discretionary',
                'XLP': 'Consumer Staples',
                'XLU': 'Utilities',
                'XLB': 'Materials',
                'XLRE': 'Real Estate'
            }
            
            sector_data = {}
            
            for etf, sector_name in sector_etfs.items():
                data = self.get_current_price(etf)
                if data:
                    sector_data[sector_name] = {
                        'symbol': etf,
                        'price': data['current_price'],
                        'change': data['percent_change']
                    }
            
            # Sort by performance
            sorted_sectors = sorted(
                sector_data.items(), 
                key=lambda x: x[1]['change'], 
                reverse=True
            )
            
            return {
                'sectors': dict(sorted_sectors),
                'best_sector': sorted_sectors[0][0] if sorted_sectors else None,
                'worst_sector': sorted_sectors[-1][0] if sorted_sectors else None,
                'timestamp': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"❌ Error getting sector performance: {e}")
            return {}
    
    def get_stock_news(self, symbol: str) -> List[Dict]:
        """Get recent news for a stock (FREE from Yahoo Finance)"""
        try:
            print(f"📰 Getting news for {symbol}...")
            
            ticker = yf.Ticker(symbol)
            news = ticker.news
            
            formatted_news = []
            for article in news[:5]:  # Get top 5 news articles
                formatted_news.append({
                    'title': article.get('title', 'No title'),
                    'publisher': article.get('publisher', 'Unknown'),
                    'link': article.get('link', ''),
                    'publish_time': datetime.fromtimestamp(
                        article.get('providerPublishTime', 0)
                    ).isoformat() if article.get('providerPublishTime') else None,
                    'type': article.get('type', 'Article')
                })
            
            return formatted_news
            
        except Exception as e:
            print(f"❌ Error getting news for {symbol}: {e}")
            return []
    
    def calculate_technical_indicators(self, data: pd.DataFrame) -> Dict:
        """Calculate technical indicators for chart analysis"""
        if data.empty or len(data) < 20:
            return {}
        
        try:
            close_prices = data['Close']
            
            indicators = {}
            
            # Moving Averages
            indicators['SMA_20'] = close_prices.rolling(window=20).mean().iloc[-1]
            indicators['SMA_50'] = close_prices.rolling(window=50).mean().iloc[-1] if len(data) >= 50 else None
            
            # RSI (Relative Strength Index)
            delta = close_prices.diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
            rs = gain / loss
            rsi = 100 - (100 / (1 + rs))
            indicators['RSI'] = rsi.iloc[-1]
            
            # Bollinger Bands
            sma_20 = close_prices.rolling(window=20).mean()
            std_20 = close_prices.rolling(window=20).std()
            indicators['BB_Upper'] = (sma_20 + (std_20 * 2)).iloc[-1]
            indicators['BB_Lower'] = (sma_20 - (std_20 * 2)).iloc[-1]
            
            # MACD
            exp1 = close_prices.ewm(span=12).mean()
            exp2 = close_prices.ewm(span=26).mean()
            macd = exp1 - exp2
            signal = macd.ewm(span=9).mean()
            indicators['MACD'] = macd.iloc[-1]
            indicators['MACD_Signal'] = signal.iloc[-1]
            
            # Volume analysis
            if 'Volume' in data.columns:
                avg_volume = data['Volume'].rolling(window=20).mean().iloc[-1]
                current_volume = data['Volume'].iloc[-1]
                indicators['Volume_Ratio'] = current_volume / avg_volume
            
            # Volatility
            returns = close_prices.pct_change()
            indicators['Volatility'] = returns.rolling(window=20).std().iloc[-1] * np.sqrt(252)  # Annualized
            
            # Round all values
            for key, value in indicators.items():
                if value is not None and not np.isnan(value):
                    indicators[key] = round(float(value), 4)
                else:
                    indicators[key] = None
            
            return indicators
            
        except Exception as e:
            print(f"❌ Error calculating technical indicators: {e}")
            return {}
    
    def get_comprehensive_stock_info(self, symbol: str) -> Dict:
        """Get everything about a stock - price, indicators, news, company info"""
        try:
            print(f"🔍 Getting comprehensive info for {symbol}...")
            
            # Get basic price info
            price_info = self.get_current_price(symbol)
            if not price_info:
                return {"error": f"Could not get data for {symbol}"}
            
            # Get historical data for technical analysis
            historical_data = self.get_stock_data(symbol, period="3mo", interval="1d")
            
            # Calculate technical indicators
            technical_indicators = {}
            if historical_data is not None and not historical_data.empty:
                technical_indicators = self.calculate_technical_indicators(historical_data)
            
            # Get recent news
            news = self.get_stock_news(symbol)
            
            # Combine everything
            comprehensive_info = {
                **price_info,
                'technical_indicators': technical_indicators,
                'recent_news': news,
                'data_points': len(historical_data) if historical_data is not None else 0,
                'analysis_timestamp': datetime.now().isoformat()
            }
            
            return comprehensive_info
            
        except Exception as e:
            print(f"❌ Error getting comprehensive info for {symbol}: {e}")
            return {"error": str(e)}
    
    def search_stocks(self, query: str) -> List[Dict]:
        """Search for stocks by company name or symbol"""
        try:
            print(f"🔎 Searching for stocks matching '{query}'...")
            
            # This is a simple implementation
            # In a real app, you might use a more sophisticated search API
            matching_stocks = []
            
            # Check if query matches any of our popular stocks
            query_upper = query.upper()
            for symbol in self.popular_stocks:
                if query_upper in symbol:
                    stock_info = self.get_current_price(symbol)
                    if stock_info:
                        matching_stocks.append(stock_info)
            
            # Also try to get info for the query directly (in case it's a valid symbol)
            if len(query) <= 5:  # Stock symbols are usually 1-5 characters
                direct_info = self.get_current_price(query_upper)
                if direct_info and direct_info not in matching_stocks:
                    matching_stocks.append(direct_info)
            
            return matching_stocks[:10]  # Return max 10 results
            
        except Exception as e:
            print(f"❌ Error searching stocks: {e}")
            return []
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics"""
        return {
            "cached_items": len(self.cache),
            "cache_duration_seconds": self.cache_duration,
            "cache_keys": list(self.cache.keys())
        }
    
    def clear_cache(self):
        """Clear the data cache"""
        self.cache.clear()
        print("🧹 Cache cleared!")

# Example usage and testing
if __name__ == "__main__":
    print("🚀 Testing Market Data Service...")
    
    # Create market data service
    market_service = MarketDataService()
    
    # Test getting current price
    print("\n📊 Testing current price...")
    apple_data = market_service.get_current_price("AAPL")
    if apple_data:
        print(f"AAPL: ${apple_data['current_price']} ({apple_data['percent_change']:+.2f}%)")
    
    # Test market summary
    print("\n📈 Testing market summary...")
    market_summary = market_service.get_market_summary()
    for index, data in market_summary.items():
        if isinstance(data, dict) and 'price' in data:
            print(f"{index}: {data['price']} ({data['percent_change']:+.2f}%)")
    
    # Test trending stocks
    print("\n🔥 Testing trending stocks...")
    trending = market_service.get_trending_stocks()
    print(f"Top 3 trending: {[f\"{s['symbol']} ({s['change']:+.2f}%)\" for s in trending[:3]]}")
    
    # Test technical indicators
    print("\n🔧 Testing technical indicators...")
    historical_data = market_service.get_stock_data("AAPL", period="3mo")
    if historical_data is not None:
        indicators = market_service.calculate_technical_indicators(historical_data)
        print(f"AAPL RSI: {indicators.get('RSI', 'N/A')}")
        print(f"AAPL MACD: {indicators.get('MACD', 'N/A')}")
    
    print("\n✅ Market Data Service test complete!")
