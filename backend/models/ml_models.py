import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import mean_squared_error, r2_score, mean_absolute_error
import yfinance as yf
from datetime import datetime, timedelta
import pickle
import os
import warnings
warnings.filterwarnings('ignore')

class StockPredictor:
    """
    This is our AI stock predictor! It's like having a super smart friend
    who studied thousands of stocks and can guess what might happen tomorrow.
    """
    
    def __init__(self, symbol: str):
        self.symbol = symbol.upper()
        self.model = None
        self.scaler = StandardScaler()
        self.feature_names = []
        self.model_type = "RandomForest"
        self.accuracy_score = 0.0
        self.last_trained = None
        
    def fetch_data(self, period: str = "2y"):
        """Get stock data from Yahoo Finance (it's FREE!)"""
        try:
            print(f"📡 Fetching data for {self.symbol}...")
            ticker = yf.Ticker(self.symbol)
            data = ticker.history(period=period)
            
            if data.empty:
                print(f"❌ No data found for {self.symbol}")
                return None
                
            print(f"✅ Got {len(data)} days of data for {self.symbol}")
            return data
            
        except Exception as e:
            print(f"❌ Error fetching data: {e}")
            return None
    
    def create_technical_indicators(self, data: pd.DataFrame):
        """Create technical indicators - these are like clues for our AI"""
        df = data.copy()
        
        # Moving Averages (trends)
        df['SMA_5'] = df['Close'].rolling(window=5).mean()    # 5-day average
        df['SMA_10'] = df['Close'].rolling(window=10).mean()  # 10-day average
        df['SMA_20'] = df['Close'].rolling(window=20).mean()  # 20-day average
        df['SMA_50'] = df['Close'].rolling(window=50).mean()  # 50-day average
        
        # Exponential Moving Averages (recent prices matter more)
        df['EMA_12'] = df['Close'].ewm(span=12).mean()
        df['EMA_26'] = df['Close'].ewm(span=26).mean()
        
        # MACD (Moving Average Convergence Divergence) - momentum indicator
        df['MACD'] = df['EMA_12'] - df['EMA_26']
        df['MACD_Signal'] = df['MACD'].ewm(span=9).mean()
        df['MACD_Histogram'] = df['MACD'] - df['MACD_Signal']
        
        # RSI (Relative Strength Index) - is stock overbought or oversold?
        df['RSI'] = self.calculate_rsi(df['Close'])
        
        # Bollinger Bands - price volatility
        df['BB_Middle'] = df['Close'].rolling(window=20).mean()
        bb_std = df['Close'].rolling(window=20).std()
        df['BB_Upper'] = df['BB_Middle'] + (bb_std * 2)
        df['BB_Lower'] = df['BB_Middle'] - (bb_std * 2)
        df['BB_Width'] = df['BB_Upper'] - df['BB_Lower']
        df['BB_Position'] = (df['Close'] - df['BB_Lower']) / (df['BB_Upper'] - df['BB_Lower'])
        
        # Price and Volume changes
        df['Price_Change'] = df['Close'].pct_change()
        df['Volume_Change'] = df['Volume'].pct_change()
        df['High_Low_Ratio'] = df['High'] / df['Low']
        df['Open_Close_Ratio'] = df['Open'] / df['Close']
        
        # Volatility (how much the price jumps around)
        df['Volatility'] = df['Close'].rolling(window=10).std()
        
        # Price position within the day's range
        df['Price_Position'] = (df['Close'] - df['Low']) / (df['High'] - df['Low'])
        
        # Momentum indicators
        df['Momentum_5'] = df['Close'] / df['Close'].shift(5)
        df['Momentum_10'] = df['Close'] / df['Close'].shift(10)
        
        # Volume indicators
        df['Volume_SMA'] = df['Volume'].rolling(window=20).mean()
        df['Volume_Ratio'] = df['Volume'] / df['Volume_SMA']
        
        return df
    
    def calculate_rsi(self, prices, window=14):
        """Calculate RSI - tells us if stock is overbought or oversold"""
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def prepare_features(self, data: pd.DataFrame):
        """Prepare features for our AI model"""
        # Select the features our AI will use to make predictions
        feature_columns = [
            'Open', 'High', 'Low', 'Volume',
            'SMA_5', 'SMA_10', 'SMA_20', 'SMA_50',
            'EMA_12', 'EMA_26', 'MACD', 'MACD_Signal', 'MACD_Histogram',
            'RSI', 'BB_Width', 'BB_Position',
            'Price_Change', 'Volume_Change', 'High_Low_Ratio', 'Open_Close_Ratio',
            'Volatility', 'Price_Position', 'Momentum_5', 'Momentum_10',
            'Volume_Ratio'
        ]
        
        # Create target (what we want to predict - tomorrow's closing price)
        data['Target'] = data['Close'].shift(-1)  # Tomorrow's price
        
        # Remove rows with missing data
        data_clean = data[feature_columns + ['Target']].dropna()
        
        if len(data_clean) < 50:
            print("❌ Not enough clean data for training")
            return None, None, None
        
        X = data_clean[feature_columns]
        y = data_clean['Target']
        
        self.feature_names = feature_columns
        
        print(f"✅ Prepared {len(X)} samples with {len(feature_columns)} features")
        return X, y, data_clean
    
    def train_model(self, model_type: str = "RandomForest"):
        """Train our AI model"""
        print(f"🤖 Training {model_type} model for {self.symbol}...")
        
        # Get data
        data = self.fetch_data("2y")  # 2 years of training data
        if data is None:
            return False
        
        # Create technical indicators
        data_with_indicators = self.create_technical_indicators(data)
        
        # Prepare features
        X, y, clean_data = self.prepare_features(data_with_indicators)
        if X is None:
            return False
        
        # Split data: 80% training, 20% testing
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, shuffle=False
        )
        
        # Scale features (normalize them)
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Choose and train model
        if model_type == "RandomForest":
            self.model = RandomForestRegressor(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        elif model_type == "GradientBoosting":
            self.model = GradientBoostingRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
        elif model_type == "LinearRegression":
            self.model = LinearRegression()
        else:
            print(f"❌ Unknown model type: {model_type}")
            return False
        
        # Train the model
        self.model.fit(X_train_scaled, y_train)
        
        # Make predictions on test set
        y_pred = self.model.predict(X_test_scaled)
        
        # Calculate accuracy metrics
        mse = mean_squared_error(y_test, y_pred)
        rmse = np.sqrt(mse)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        # Calculate directional accuracy (did we predict up/down correctly?)
        actual_direction = np.sign(y_test.values[1:] - y_test.values[:-1])
        pred_direction = np.sign(y_pred[1:] - y_pred[:-1])
        directional_accuracy = np.mean(actual_direction == pred_direction)
        
        self.accuracy_score = r2
        self.model_type = model_type
        self.last_trained = datetime.now()
        
        print(f"📊 Model Performance:")
        print(f"   📈 R² Score: {r2:.4f}")
        print(f"   📊 RMSE: ${rmse:.2f}")
        print(f"   📉 MAE: ${mae:.2f}")
        print(f"   🎯 Directional Accuracy: {directional_accuracy:.2%}")
        
        return True
    
    def predict_next_price(self):
        """Predict tomorrow's stock price"""
        if self.model is None:
            print("❌ Model not trained yet!")
            return None
        
        # Get recent data
        recent_data = self.fetch_data("3mo")  # 3 months for recent indicators
        if recent_data is None:
            return None
        
        # Create indicators
        data_with_indicators = self.create_technical_indicators(recent_data)
        
        # Get the most recent features
        latest_features = data_with_indicators[self.feature_names].iloc[-1:].values
        
        # Handle any missing values
        if np.any(np.isnan(latest_features)):
            print("❌ Missing data in recent features")
            return None
        
        # Scale features
        latest_features_scaled = self.scaler.transform(latest_features)
        
        # Make prediction
        prediction = self.model.predict(latest_features_scaled)[0]
        
        # Get current price for comparison
        current_price = recent_data['Close'].iloc[-1]
        
        # Calculate predicted change
        price_change = prediction - current_price
        percent_change = (price_change / current_price) * 100
        
        # Generate confidence score based on model performance
        confidence = min(0.95, max(0.1, self.accuracy_score))
        
        # Generate trading signal
        signal = "HOLD"
        if percent_change > 2:
            signal = "BUY"
        elif percent_change < -2:
            signal = "SELL"
        
        result = {
            "symbol": self.symbol,
            "current_price": round(current_price, 2),
            "predicted_price": round(prediction, 2),
            "price_change": round(price_change, 2),
            "percent_change": round(percent_change, 2),
            "confidence": round(confidence, 2),
            "signal": signal,
            "model_type": self.model_type,
            "accuracy_score": round(self.accuracy_score, 4),
            "prediction_date": (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            "timestamp": datetime.now().isoformat()
        }
        
        return result
    
    def get_feature_importance(self):
        """See which features our AI thinks are most important"""
        if self.model is None or not hasattr(self.model, 'feature_importances_'):
            return None
        
        importance_df = pd.DataFrame({
            'feature': self.feature_names,
            'importance': self.model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        return importance_df.head(10)  # Top 10 most important features
    
    def save_model(self, filepath: str = None):
        """Save our trained model"""
        if self.model is None:
            print("❌ No model to save!")
            return False
        
        if filepath is None:
            filepath = f"models/{self.symbol}_{self.model_type}_model.pkl"
        
        # Create directory if it doesn't exist
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        model_data = {
            'model': self.model,
            'scaler': self.scaler,
            'feature_names': self.feature_names,
            'model_type': self.model_type,
            'accuracy_score': self.accuracy_score,
            'symbol': self.symbol,
            'last_trained': self.last_trained
        }
        
        try:
            with open(filepath, 'wb') as f:
                pickle.dump(model_data, f)
            print(f"💾 Model saved to {filepath}")
            return True
        except Exception as e:
            print(f"❌ Error saving model: {e}")
            return False
    
    def load_model(self, filepath: str):
        """Load a previously trained model"""
        try:
            with open(filepath, 'rb') as f:
                model_data = pickle.load(f)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.feature_names = model_data['feature_names']
            self.model_type = model_data['model_type']
            self.accuracy_score = model_data['accuracy_score']
            self.symbol = model_data['symbol']
            self.last_trained = model_data['last_trained']
            
            print(f"📁 Model loaded from {filepath}")
            return True
            
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False

class MultiStockPredictor:
    """Manage multiple stock predictors at once"""
    
    def __init__(self):
        self.predictors = {}
    
    def add_stock(self, symbol: str):
        """Add a new stock to predict"""
        if symbol not in self.predictors:
            self.predictors[symbol] = StockPredictor(symbol)
            print(f"➕ Added {symbol} to prediction list")
    
    def train_all(self, model_type: str = "RandomForest"):
        """Train models for all stocks"""
        print(f"🚀 Training models for {len(self.predictors)} stocks...")
        
        results = {}
        for symbol, predictor in self.predictors.items():
            print(f"\n🎯 Training {symbol}...")
            success = predictor.train_model(model_type)
            results[symbol] = success
            
        successful = sum(results.values())
        print(f"\n✅ Successfully trained {successful}/{len(results)} models")
        return results
    
    def predict_all(self):
        """Get predictions for all stocks"""
        predictions = {}
        
        for symbol, predictor in self.predictors.items():
            if predictor.model is not None:
                prediction = predictor.predict_next_price()
                if prediction:
                    predictions[symbol] = prediction
        
        return predictions
    
    def get_top_picks(self, n: int = 5):
        """Get top stock picks based on predicted returns"""
        predictions = self.predict_all()
        
        if not predictions:
            return []
        
        # Sort by predicted percent change
        sorted_predictions = sorted(
            predictions.items(),
            key=lambda x: x[1]['percent_change'],
            reverse=True
        )
        
        return sorted_predictions[:n]

# Example usage
if __name__ == "__main__":
    # Test single stock predictor
    print("🚀 Testing AI Stock Predictor...")
    
    predictor = StockPredictor("AAPL")
    
    # Train model
    if predictor.train_model("RandomForest"):
        # Make prediction
        prediction = predictor.predict_next_price()
        if prediction:
            print(f"\n🔮 Prediction for {prediction['symbol']}:")
            print(f"   Current: ${prediction['current_price']}")
            print(f"   Predicted: ${prediction['predicted_price']}")
            print(f"   Change: {prediction['percent_change']:.2f}%")
            print(f"   Signal: {prediction['signal']}")
            print(f"   Confidence: {prediction['confidence']:.2%}")
        
        # Show feature importance
        importance = predictor.get_feature_importance()
        if importance is not None:
            print(f"\n📊 Top 5 Most Important Features:")
            for i, row in importance.head().iterrows():
                print(f"   {row['feature']}: {row['importance']:.4f}")
