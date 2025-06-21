from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import yfinance as yf
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import json
import asyncio
from datetime import datetime, timedelta
import sqlite3
import os

# Create FastAPI app
app = FastAPI(title="AI Trading Bot", version="1.0.0")

# Add CORS middleware so our React frontend can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
connected_clients = []
trading_data = {}

# Initialize database
def init_database():
    """Create our SQLite database if it doesn't exist"""
    conn = sqlite3.connect('trading_bot.db')
    cursor = conn.cursor()
    
    # Create table for storing stock data
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
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create table for storing predictions
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            predicted_price REAL,
            actual_price REAL,
            prediction_date TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize database when server starts
init_database()

def get_stock_data(symbol: str, period: str = "1y"):
    """Get stock data from Yahoo Finance - this is FREE!"""
    try:
        ticker = yf.Ticker(symbol)
        data = ticker.history(period=period)
        return data
    except Exception as e:
        print(f"Error getting data for {symbol}: {e}")
        return None

def create_ml_features(data):
    """Create features for our AI model"""
    if data is None or len(data) < 20:
        return None, None
    
    # Create technical indicators
    data['SMA_10'] = data['Close'].rolling(window=10).mean()  # 10-day moving average
    data['SMA_30'] = data['Close'].rolling(window=30).mean()  # 30-day moving average
    data['RSI'] = calculate_rsi(data['Close'])  # Relative Strength Index
    data['Price_Change'] = data['Close'].pct_change()  # Daily price change
    data['Volume_Change'] = data['Volume'].pct_change()  # Daily volume change
    
    # Create features (X) and target (y)
    features = ['Open', 'High', 'Low', 'Volume', 'SMA_10', 'SMA_30', 'RSI', 'Price_Change', 'Volume_Change']
    
    # Remove rows with NaN values
    data_clean = data.dropna()
    
    if len(data_clean) < 10:
        return None, None
    
    X = data_clean[features].values
    y = data_clean['Close'].values
    
    return X, y

def calculate_rsi(prices, window=14):
    """Calculate Relative Strength Index"""
    delta = prices.diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    rsi = 100 - (100 / (1 + rs))
    return rsi

def train_model(symbol: str):
    """Train our AI model to predict stock prices"""
    try:
        # Get historical data
        data = get_stock_data(symbol, "2y")  # 2 years of data for training
        
        if data is None:
            return None
        
        # Create features
        X, y = create_ml_features(data)
        
        if X is None or len(X) < 10:
            return None
        
        # Split data: use last 30 days for testing, rest for training
        split_point = len(X) - 30
        X_train, X_test = X[:split_point], X[split_point:]
        y_train, y_test = y[:split_point], y[split_point:]
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train Random Forest model
        model = RandomForestRegressor(n_estimators=100, random_state=42)
        model.fit(X_train_scaled, y_train)
        
        # Make predictions
        predictions = model.predict(X_test_scaled)
        
        # Calculate accuracy
        accuracy = model.score(X_test_scaled, y_test)
        
        return {
            'model': model,
            'scaler': scaler,
            'accuracy': accuracy,
            'predictions': predictions.tolist(),
            'actual': y_test.tolist()
        }
        
    except Exception as e:
        print(f"Error training model for {symbol}: {e}")
        return None

@app.get("/")
async def root():
    """Welcome message"""
    return {"message": "AI Trading Bot is running! 🚀"}

@app.get("/health")
async def health_check():
    """Check if our bot is healthy"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/stock/{symbol}")
async def get_stock_info(symbol: str):
    """Get current stock information"""
    try:
        # Get current data
        data = get_stock_data(symbol.upper(), "5d")  # Last 5 days
        
        if data is None or len(data) == 0:
            return {"error": f"Could not get data for {symbol}"}
        
        # Get the latest price
        latest = data.iloc[-1]
        previous = data.iloc[-2] if len(data) > 1 else latest
        
        # Calculate change
        price_change = latest['Close'] - previous['Close']
        percent_change = (price_change / previous['Close']) * 100
        
        return {
            "symbol": symbol.upper(),
            "current_price": round(latest['Close'], 2),
            "price_change": round(price_change, 2),
            "percent_change": round(percent_change, 2),
            "volume": int(latest['Volume']),
            "high": round(latest['High'], 2),
            "low": round(latest['Low'], 2),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.get("/predict/{symbol}")
async def predict_stock_price(symbol: str):
    """Use AI to predict tomorrow's stock price"""
    try:
        # Train model
        result = train_model(symbol.upper())
        
        if result is None:
            return {"error": f"Could not train model for {symbol}"}
        
        # Get current data for prediction
        current_data = get_stock_data(symbol.upper(), "1mo")
        
        if current_data is None:
            return {"error": f"Could not get current data for {symbol}"}
        
        # Create features for latest data
        X, _ = create_ml_features(current_data)
        
        if X is None:
            return {"error": "Could not create features for prediction"}
        
        # Make prediction for tomorrow
        latest_features = X[-1].reshape(1, -1)
        latest_features_scaled = result['scaler'].transform(latest_features)
        tomorrow_prediction = result['model'].predict(latest_features_scaled)[0]
        
        current_price = current_data['Close'].iloc[-1]
        predicted_change = tomorrow_prediction - current_price
        predicted_percent_change = (predicted_change / current_price) * 100
        
        return {
            "symbol": symbol.upper(),
            "current_price": round(current_price, 2),
            "predicted_price": round(tomorrow_prediction, 2),
            "predicted_change": round(predicted_change, 2),
            "predicted_percent_change": round(predicted_percent_change, 2),
            "model_accuracy": round(result['accuracy'], 2),
            "prediction_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        return {"error": str(e)}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time updates"""
    await websocket.accept()
    connected_clients.append(websocket)
    
    try:
        while True:
            # Send real-time data every 30 seconds
            await asyncio.sleep(30)
            
            # Example: Send AAPL data
            stock_data = await get_stock_info("AAPL")
            await websocket.send_text(json.dumps(stock_data))
            
    except WebSocketDisconnect:
        connected_clients.remove(websocket)

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
