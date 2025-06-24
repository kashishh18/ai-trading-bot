# AI Trading Bot

I developed this automated trading bot as part of my computer science capstone project. The system uses machine learning algorithms to predict stock price movements and can execute trades automatically. Currently, I'm using it primarily for paper trading while I continue to refine the models.

## What it does

The bot continuously monitors market conditions and generates price predictions using multiple machine learning models. I've implemented Random Forest, Gradient Boosting, and Linear Regression algorithms, with Random Forest currently providing the best results. The system analyzes 25+ technical indicators and provides confidence scores to help evaluate prediction reliability.

### Main features:
- **AI predictions** - Uses Random Forest, Gradient Boosting, and Linear Regression
- **Real-time data** - Integrates with Yahoo Finance API for market data
- **Risk management** - Implements position sizing and stop-loss mechanisms
- **Discord notifications** - Sends real-time alerts for trading opportunities
- **Nice UI** - Built with React, actually looks pretty professional

## How to run it

You'll need Python 3.9+ and Node.js installed. The application has been developed and tested on macOS but should work on other platforms.

```bash
# Clone it
git clone https://github.com/your-username/ai-trading-bot.git
cd ai-trading-bot

# Backend setup
cd backend
python3 -m venv trading_bot_env
source trading_bot_env/bin/activate
pip install -r requirements.txt

# Frontend setup  
cd ../frontend
npm install

# Run both (need two terminals)
# Terminal 1:
cd backend && python main.py

# Terminal 2:
cd frontend && npm start
```

Then go to `http://localhost:3000` and you should see the dashboard.

## Architecture

```
ai-trading-bot/
├── backend/           # Python FastAPI server
│   ├── models/        # ML models live here
│   ├── services/      # Market data and trading logic
│   └── integrations/  # Discord bot
├── frontend/          # React app
│   └── src/components/
└── README.md
```

I chose FastAPI for the backend due to its performance and automatic API documentation features. The frontend uses React with TypeScript for better type safety and development experience.

## The ML stuff

The prediction models train on 2 years of historical data and automatically retrain weekly. The system tracks 25+ technical indicators including RSI, MACD, and Bollinger Bands. The Random Forest model currently achieves approximately 65% prediction accuracy.

The confidence scoring system was a key challenge to implement properly. The bot only executes trades when confidence levels exceed 60%, though I typically wait for 70%+ confidence before taking action.

## Performance so far

After 3 months of paper trading, the system has demonstrated promising results:
- 68% win rate on predictions with confidence levels above 70%
- Approximately 12% simulated returns compared to 8% for the S&P 500 over the same period
- Successfully managed risk during market volatility events

**Important Note:** This project is for educational purposes only. All performance data represents simulated trading results.

## What's next

Future development plans include:
- [ ] Options trading functionality
- [ ] Cryptocurrency market support  
- [ ] Enhanced backtesting capabilities
- [ ] Mobile application development

## Tech stack

**Backend:**
- FastAPI (Python web framework)
- scikit-learn (ML models)
- pandas/numpy (data processing)
- yfinance (free stock data)

**Frontend:**
- React 18 + TypeScript
- Tailwind CSS for styling
- Recharts for graphs

## Contributing

Contributions and suggestions are welcome. Please feel free to submit pull requests or open issues for improvements, particularly regarding prediction accuracy enhancements.

## Disclaimer

This project was developed for educational purposes as part of my computer science studies. It is not intended as financial advice, and I assume no responsibility for any financial losses that may result from its use. 

The system includes risk management features, but financial markets are inherently unpredictable. Users should conduct their own research and consider starting with paper trading. Never invest more than you can afford to lose.

---

*Computer Science Student Project - 2025*
