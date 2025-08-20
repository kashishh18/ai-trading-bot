-- Create enum types for trading application
CREATE TYPE public.signal_type AS ENUM ('buy', 'sell', 'hold');
CREATE TYPE public.position_status AS ENUM ('active', 'closed', 'pending');
CREATE TYPE public.trade_type AS ENUM ('market', 'limit', 'stop_loss', 'take_profit');

-- Stock price data table
CREATE TABLE public.stock_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open_price DECIMAL(10,4) NOT NULL,
  high_price DECIMAL(10,4) NOT NULL,
  low_price DECIMAL(10,4) NOT NULL,
  close_price DECIMAL(10,4) NOT NULL,
  volume BIGINT NOT NULL,
  adjusted_close DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, date)
);

-- AI predictions table
CREATE TABLE public.ai_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  prediction_date DATE NOT NULL,
  predicted_price DECIMAL(10,4) NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  signal_type signal_type NOT NULL,
  model_version TEXT NOT NULL,
  technical_indicators JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Portfolio positions table
CREATE TABLE public.portfolio_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  shares_owned DECIMAL(10,6) NOT NULL,
  average_buy_price DECIMAL(10,4) NOT NULL,
  current_price DECIMAL(10,4),
  position_status position_status NOT NULL DEFAULT 'active',
  stop_loss_price DECIMAL(10,4),
  take_profit_price DECIMAL(10,4),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Trading signals table
CREATE TABLE public.trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type signal_type NOT NULL,
  target_price DECIMAL(10,4) NOT NULL,
  confidence_score DECIMAL(5,4) NOT NULL,
  risk_score DECIMAL(5,4) NOT NULL,
  reasoning TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_executed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Trading history table
CREATE TABLE public.trading_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  trade_type trade_type NOT NULL,
  shares DECIMAL(10,6) NOT NULL,
  price DECIMAL(10,4) NOT NULL,
  total_amount DECIMAL(12,4) NOT NULL,
  profit_loss DECIMAL(12,4),
  commission DECIMAL(8,4) DEFAULT 0,
  executed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signal_id UUID REFERENCES public.trading_signals(id)
);

-- User portfolio summary table
CREATE TABLE public.portfolio_summary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  total_value DECIMAL(12,4) NOT NULL DEFAULT 0,
  cash_balance DECIMAL(12,4) NOT NULL DEFAULT 10000, -- Start with $10k paper money
  invested_amount DECIMAL(12,4) NOT NULL DEFAULT 0,
  daily_change DECIMAL(12,4) NOT NULL DEFAULT 0,
  daily_change_percent DECIMAL(6,4) NOT NULL DEFAULT 0,
  total_profit_loss DECIMAL(12,4) NOT NULL DEFAULT 0,
  risk_tolerance DECIMAL(3,2) NOT NULL DEFAULT 0.5 CHECK (risk_tolerance >= 0 AND risk_tolerance <= 1),
  max_position_size DECIMAL(3,2) NOT NULL DEFAULT 0.1 CHECK (max_position_size > 0 AND max_position_size <= 1),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Watchlist table
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, symbol)
);

-- Create indexes for performance
CREATE INDEX idx_stock_prices_symbol_date ON public.stock_prices(symbol, date);
CREATE INDEX idx_ai_predictions_symbol_date ON public.ai_predictions(symbol, prediction_date);
CREATE INDEX idx_portfolio_positions_user_id ON public.portfolio_positions(user_id);
CREATE INDEX idx_trading_history_user_id ON public.trading_history(user_id);
CREATE INDEX idx_trading_signals_expires_at ON public.trading_signals(expires_at);

-- Enable Row Level Security
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock data (public read access)
CREATE POLICY "Anyone can view stock prices" 
ON public.stock_prices 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view AI predictions" 
ON public.ai_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view trading signals" 
ON public.trading_signals 
FOR SELECT 
USING (true);

-- RLS Policies for user-specific data
CREATE POLICY "Users can manage their own portfolio positions" 
ON public.portfolio_positions 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own trading history" 
ON public.trading_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own portfolio summary" 
ON public.portfolio_summary 
FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own watchlist" 
ON public.watchlist 
FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updating portfolio summary
CREATE OR REPLACE FUNCTION public.update_portfolio_summary()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_portfolio_summary_updated_at
BEFORE UPDATE ON public.portfolio_summary
FOR EACH ROW
EXECUTE FUNCTION public.update_portfolio_summary();

CREATE TRIGGER update_portfolio_positions_updated_at
BEFORE UPDATE ON public.portfolio_positions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
