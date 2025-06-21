import sqlite3
import pandas as pd
from datetime import datetime, timedelta
import os
from typing import List, Dict, Optional

class DatabaseManager:
    """
    This class manages our SQLite database - think of it like a smart filing cabinet
    that can store and retrieve all our trading data super fast!
    """
    
    def __init__(self, db_path: str = "trading_bot.db"):
        """Initialize our database connection"""
        self.db_path = db_path
        self.init_database()
    
    def init_database(self):
        """Create all the tables we need if they don't exist"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Table for storing stock price data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stock_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                date TEXT NOT NULL,
                open_price REAL,
                high_price REAL,
                low_price REAL,
                close_price REAL,
                volume INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(symbol, date)
            )
        ''')
        
        # Table for storing our AI predictions
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                predicted_price REAL,
                actual_price REAL,
                prediction_date TEXT,
                accuracy_score REAL,
                model_type TEXT DEFAULT 'RandomForest',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table for tracking our portfolio (paper trading)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS portfolio (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                shares REAL NOT NULL,
                buy_price REAL NOT NULL,
                current_price REAL,
                profit_loss REAL,
                buy_date TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Table for trading signals (buy/sell recommendations)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS trading_signals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                symbol TEXT NOT NULL,
                signal_type TEXT NOT NULL,  -- 'BUY', 'SELL', 'HOLD'
                confidence REAL,  -- How confident is our AI? (0-1)
                price REAL,
                reason TEXT,  -- Why did we make this recommendation?
                signal_date TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        conn.commit()
        conn.close()
        print("✅ Database initialized successfully!")
    
    def save_stock_data(self, symbol: str, data: pd.DataFrame):
        """Save stock price data to our database"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Prepare data for insertion
            records = []
            for date, row in data.iterrows():
                records.append((
                    symbol.upper(),
                    date.strftime('%Y-%m-%d'),
                    float(row['Open']),
                    float(row['High']),
                    float(row['Low']),
                    float(row['Close']),
                    int(row['Volume'])
                ))
            
            # Insert data (ignore duplicates)
            cursor = conn.cursor()
            cursor.executemany('''
                INSERT OR IGNORE INTO stock_data 
                (symbol, date, open_price, high_price, low_price, close_price, volume)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', records)
            
            conn.commit()
            conn.close()
            print(f"💾 Saved {len(records)} records for {symbol}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving stock data: {e}")
            return False
    
    def get_stock_data(self, symbol: str, days: int = 30) -> pd.DataFrame:
        """Get stock data from our database"""
        try:
            conn = sqlite3.connect(self.db_path)
            
            # Get data from the last N days
            query = '''
                SELECT date, open_price, high_price, low_price, close_price, volume
                FROM stock_data 
                WHERE symbol = ? 
                ORDER BY date DESC 
                LIMIT ?
            '''
            
            df = pd.read_sql_query(query, conn, params=(symbol.upper(), days))
            conn.close()
            
            if not df.empty:
                df['date'] = pd.to_datetime(df['date'])
                df.set_index('date', inplace=True)
                df.columns = ['Open', 'High', 'Low', 'Close', 'Volume']
                df = df.sort_index()  # Sort by date ascending
            
            return df
            
        except Exception as e:
            print(f"❌ Error getting stock data: {e}")
            return pd.DataFrame()
    
    def save_prediction(self, symbol: str, predicted_price: float, 
                       actual_price: float = None, accuracy: float = None):
        """Save our AI's prediction"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO predictions 
                (symbol, predicted_price, actual_price, prediction_date, accuracy_score)
                VALUES (?, ?, ?, ?, ?)
            ''', (
                symbol.upper(),
                predicted_price,
                actual_price,
                datetime.now().strftime('%Y-%m-%d'),
                accuracy
            ))
            
            conn.commit()
            conn.close()
            print(f"🔮 Saved prediction for {symbol}: ${predicted_price:.2f}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving prediction: {e}")
            return False
    
    def get_predictions(self, symbol: str = None, days: int = 30) -> List[Dict]:
        """Get our prediction history"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            if symbol:
                query = '''
                    SELECT * FROM predictions 
                    WHERE symbol = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                '''
                cursor.execute(query, (symbol.upper(), days))
            else:
                query = '''
                    SELECT * FROM predictions 
                    ORDER BY created_at DESC 
                    LIMIT ?
                '''
                cursor.execute(query, (days,))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            predictions = []
            for row in results:
                predictions.append({
                    'id': row[0],
                    'symbol': row[1],
                    'predicted_price': row[2],
                    'actual_price': row[3],
                    'prediction_date': row[4],
                    'accuracy_score': row[5],
                    'model_type': row[6],
                    'created_at': row[7]
                })
            
            return predictions
            
        except Exception as e:
            print(f"❌ Error getting predictions: {e}")
            return []
    
    def save_trading_signal(self, symbol: str, signal_type: str, 
                           confidence: float, price: float, reason: str):
        """Save a trading signal (buy/sell recommendation)"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO trading_signals 
                (symbol, signal_type, confidence, price, reason, signal_date)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (
                symbol.upper(),
                signal_type.upper(),
                confidence,
                price,
                reason,
                datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            ))
            
            conn.commit()
            conn.close()
            print(f"📊 Saved {signal_type} signal for {symbol}")
            return True
            
        except Exception as e:
            print(f"❌ Error saving trading signal: {e}")
            return False
    
    def get_trading_signals(self, symbol: str = None, days: int = 7) -> List[Dict]:
        """Get recent trading signals"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Get signals from the last N days
            cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            if symbol:
                query = '''
                    SELECT * FROM trading_signals 
                    WHERE symbol = ? AND signal_date >= ?
                    ORDER BY created_at DESC
                '''
                cursor.execute(query, (symbol.upper(), cutoff_date))
            else:
                query = '''
                    SELECT * FROM trading_signals 
                    WHERE signal_date >= ?
                    ORDER BY created_at DESC
                '''
                cursor.execute(query, (cutoff_date,))
            
            results = cursor.fetchall()
            conn.close()
            
            # Convert to list of dictionaries
            signals = []
            for row in results:
                signals.append({
                    'id': row[0],
                    'symbol': row[1],
                    'signal_type': row[2],
                    'confidence': row[3],
                    'price': row[4],
                    'reason': row[5],
                    'signal_date': row[6],
                    'created_at': row[7]
                })
            
            return signals
            
        except Exception as e:
            print(f"❌ Error getting trading signals: {e}")
            return []
    
    def get_database_stats(self) -> Dict:
        """Get some cool stats about our database"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            # Count records in each table
            stats = {}
            
            cursor.execute("SELECT COUNT(*) FROM stock_data")
            stats['total_stock_records'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM predictions")
            stats['total_predictions'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(*) FROM trading_signals")
            stats['total_signals'] = cursor.fetchone()[0]
            
            cursor.execute("SELECT COUNT(DISTINCT symbol) FROM stock_data")
            stats['unique_symbols'] = cursor.fetchone()[0]
            
            # Get most recent data date
            cursor.execute("SELECT MAX(date) FROM stock_data")
            latest_date = cursor.fetchone()[0]
            stats['latest_data_date'] = latest_date
            
            conn.close()
            return stats
            
        except Exception as e:
            print(f"❌ Error getting database stats: {e}")
            return {}
    
    def cleanup_old_data(self, days: int = 365):
        """Clean up old data to keep database fast"""
        try:
            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            
            cutoff_date = (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')
            
            # Delete old stock data
            cursor.execute("DELETE FROM stock_data WHERE date < ?", (cutoff_date,))
            deleted_stock = cursor.rowcount
            
            # Delete old predictions
            cursor.execute("DELETE FROM predictions WHERE prediction_date < ?", (cutoff_date,))
            deleted_predictions = cursor.rowcount
            
            # Delete old signals
            cursor.execute("DELETE FROM trading_signals WHERE signal_date < ?", (cutoff_date,))
            deleted_signals = cursor.rowcount
            
            conn.commit()
            conn.close()
            
            print(f"🧹 Cleaned up old data:")
            print(f"   - {deleted_stock} stock records")
            print(f"   - {deleted_predictions} predictions")
            print(f"   - {deleted_signals} signals")
            
            return True
            
        except Exception as e:
            print(f"❌ Error cleaning up database: {e}")
            return False

# Example usage
if __name__ == "__main__":
    # Test our database manager
    db = DatabaseManager()
    
    # Print some stats
    stats = db.get_database_stats()
    print("📊 Database Stats:", stats)
    
    # Get recent signals
    signals = db.get_trading_signals()
    print(f"📈 Recent signals: {len(signals)}")
