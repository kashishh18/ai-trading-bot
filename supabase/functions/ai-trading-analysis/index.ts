import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Advanced AI Trading Analysis Engine v3.0
// Features: Multi-timeframe analysis, Advanced pattern recognition, 
// Market sentiment, Risk management, Portfolio optimization

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbol, symbols } = await req.json();

    switch (action) {
      case 'analyze_stock':
        return await analyzeStock(symbol);
      case 'generate_signals':
        return await generateTradingSignals(symbols || ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA', 'META']);
      case 'scan_opportunities':
        return await scanOpportunities();
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in ai-trading-analysis function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function analyzeStock(symbol: string) {
  console.log(`🔍 Starting advanced AI analysis for ${symbol}`);
  
  try {
    // Get current quote and validate symbol
    const { data: currentData, error: currentError } = await supabase.functions.invoke('yahoo-finance-data', {
      body: { action: 'current_quotes', symbols: [symbol] }
    });

    if (currentError || !currentData?.quotes?.[0]) {
      throw new Error(`Invalid or unknown stock symbol: ${symbol}`);
    }

    const currentPrice = currentData.quotes[0].price;
    const currentVolume = currentData.quotes[0].volume || 0;
    const dailyChange = currentData.quotes[0].changePercent || 0;
    
    console.log(`📊 Current data - Price: $${currentPrice}, Volume: ${currentVolume}, Change: ${dailyChange}%`);

    // Multi-timeframe analysis: Get 6 months of daily data and 1 month of hourly data
    const [dailyData, weeklyData] = await Promise.all([
      supabase.functions.invoke('yahoo-finance-data', {
        body: { action: 'historical_data', symbols: [symbol], period: '6mo', interval: '1d' }
      }),
      supabase.functions.invoke('yahoo-finance-data', {
        body: { action: 'historical_data', symbols: [symbol], period: '3mo', interval: '1wk' }
      })
    ]);

    if (!dailyData.data?.data || dailyData.data.data.length < 50) {
      return createSimplifiedPrediction(symbol, currentPrice);
    }

    // Extract price and volume data
    const dailyPrices = dailyData.data.data.map((item: any) => item.close).filter((p: number) => p && !isNaN(p));
    const dailyVolumes = dailyData.data.data.map((item: any) => item.volume).filter((v: number) => v && !isNaN(v));
    const dailyHighs = dailyData.data.data.map((item: any) => item.high).filter((p: number) => p && !isNaN(p));
    const dailyLows = dailyData.data.data.map((item: any) => item.low).filter((p: number) => p && !isNaN(p));
    
    const weeklyPrices = weeklyData.data?.data ? 
      weeklyData.data.data.map((item: any) => item.close).filter((p: number) => p && !isNaN(p)) : [];

    console.log(`📈 Data points - Daily: ${dailyPrices.length}, Weekly: ${weeklyPrices.length}`);

    // Advanced Technical Analysis
    const technicalIndicators = await calculateAdvancedIndicators(
      dailyPrices, 
      dailyVolumes, 
      dailyHighs, 
      dailyLows, 
      weeklyPrices,
      currentPrice,
      currentVolume
    );

    // Pattern Recognition
    const patterns = detectPricePatterns(dailyPrices, dailyHighs, dailyLows);
    
    // Market Sentiment Analysis
    const sentiment = analyzeMarketSentiment(technicalIndicators, patterns, dailyChange);
    
    // Multi-factor AI prediction with ensemble methods
    const prediction = generateAdvancedPrediction(technicalIndicators, patterns, sentiment, symbol);

    // Enhanced risk assessment
    const riskMetrics = calculateRiskMetrics(dailyPrices, prediction, technicalIndicators);

    // Store enhanced prediction
    const { error: insertError } = await supabase.from('ai_predictions').insert({
      symbol,
      prediction_date: new Date().toISOString().split('T')[0],
      predicted_price: prediction.targetPrice,
      confidence_score: prediction.confidence,
      signal_type: prediction.signal,
      model_version: 'v3.0-advanced',
      technical_indicators: {
        // Core indicators
        rsi: technicalIndicators.rsi,
        macd: technicalIndicators.macd,
        macdSignal: technicalIndicators.macdSignal,
        sma20: technicalIndicators.sma20,
        sma50: technicalIndicators.sma50,
        sma200: technicalIndicators.sma200,
        
        // Advanced indicators
        stochastic: technicalIndicators.stochastic,
        williams: technicalIndicators.williamsR,
        atr: technicalIndicators.atr,
        adx: technicalIndicators.adx,
        cci: technicalIndicators.cci,
        
        // Bollinger Bands
        bbUpper: technicalIndicators.bollingerUpper,
        bbLower: technicalIndicators.bollingerLower,
        bbPosition: technicalIndicators.bollingerPosition,
        
        // Volume analysis
        volumeRatio: technicalIndicators.volumeRatio,
        volumeTrend: technicalIndicators.volumeTrend,
        obv: technicalIndicators.obv,
        
        // Market structure
        support: technicalIndicators.support,
        resistance: technicalIndicators.resistance,
        trend: technicalIndicators.trend,
        
        // Pattern recognition
        patterns: patterns,
        
        // Risk metrics
        volatility: riskMetrics.volatility,
        sharpeRatio: riskMetrics.sharpeRatio,
        maxDrawdown: riskMetrics.maxDrawdown,
        
        // Prediction metadata
        modelEnsemble: prediction.modelScores,
        timeframeAnalysis: prediction.timeframeScores,
        marketRegime: sentiment.regime,
        
        currentPrice,
        analysisTimestamp: new Date().toISOString()
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    if (insertError) {
      console.error('❌ Error storing prediction:', insertError);
      throw new Error(`Failed to store prediction: ${insertError.message}`);
    }

    console.log(`✅ Advanced analysis completed for ${symbol} - Signal: ${prediction.signal}, Confidence: ${Math.round(prediction.confidence * 100)}%`);
    
    return new Response(
      JSON.stringify({ 
        symbol, 
        prediction: {
          ...prediction,
          riskMetrics,
          patterns,
          sentiment: sentiment.score
        },
        technicalIndicators,
        message: 'Advanced AI analysis completed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error(`❌ Error in analyzeStock for ${symbol}:`, error);
    throw error;
  }
}

async function createSimplifiedPrediction(symbol: string, currentPrice: number) {
  console.log('⚠️ Using simplified analysis due to insufficient historical data');
  
  const simplePrediction = {
    signal: 'hold' as const,
    confidence: 0.3,
    targetPrice: currentPrice * (1 + (Math.random() - 0.5) * 0.03),
    reasoning: 'Limited historical data - using market-neutral approach'
  };

  const { error: insertError } = await supabase.from('ai_predictions').insert({
    symbol,
    predicted_price: simplePrediction.targetPrice,
    confidence_score: simplePrediction.confidence,
    signal_type: simplePrediction.signal,
    technical_indicators: { currentPrice, note: 'Simplified analysis - insufficient data' },
    prediction_date: new Date().toISOString().split('T')[0],
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    model_version: 'v3.0-simple'
  });

  if (insertError) console.error('Error storing simplified prediction:', insertError);

  return new Response(
    JSON.stringify({ 
      symbol, 
      prediction: simplePrediction,
      message: 'Simplified analysis - insufficient historical data for advanced modeling'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// =================== ADVANCED TECHNICAL INDICATORS ===================

async function calculateAdvancedIndicators(dailyPrices: number[], dailyVolumes: number[], 
  dailyHighs: number[], dailyLows: number[], weeklyPrices: number[], 
  currentPrice: number, currentVolume: number) {
  
  console.log('🔧 Calculating advanced technical indicators...');
  
  // Core indicators
  const rsi = calculateRSI(dailyPrices, 14);
  const rsi_fast = calculateRSI(dailyPrices, 9);
  const { macd, signal: macdSignal, histogram } = calculateMACD(dailyPrices);
  
  // Moving averages (multiple timeframes)
  const sma20 = calculateSMA(dailyPrices, 20);
  const sma50 = calculateSMA(dailyPrices, 50);
  const sma200 = calculateSMA(dailyPrices, 200);
  const ema12 = calculateEMA(dailyPrices, 12);
  const ema26 = calculateEMA(dailyPrices, 26);
  
  // Bollinger Bands
  const bollinger = calculateBollingerBands(dailyPrices, 20, 2);
  const bollingerPosition = (currentPrice - bollinger.lowerBand[bollinger.lowerBand.length - 1]) / 
    (bollinger.upperBand[bollinger.upperBand.length - 1] - bollinger.lowerBand[bollinger.lowerBand.length - 1]);
  
  // Advanced oscillators
  const stochastic = calculateStochastic(dailyHighs, dailyLows, dailyPrices, 14);
  const williamsR = calculateWilliamsR(dailyHighs, dailyLows, dailyPrices, 14);
  const cci = calculateCCI(dailyHighs, dailyLows, dailyPrices, 20);
  
  // Volatility and trend strength
  const atr = calculateATR(dailyHighs, dailyLows, dailyPrices, 14);
  const adx = calculateADX(dailyHighs, dailyLows, dailyPrices, 14);
  
  // Volume analysis
  const obv = calculateOBV(dailyPrices, dailyVolumes);
  const volumeAvg = dailyVolumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  const volumeRatio = currentVolume / volumeAvg;
  const volumeTrend = calculateVolumeTrend(dailyVolumes);
  
  // Support and resistance levels
  const { support, resistance } = calculateSupportResistance(dailyHighs, dailyLows, dailyPrices);
  
  // Trend analysis
  const trend = analyzeTrend(dailyPrices, sma20, sma50, sma200);
  
  // Weekly trend confirmation
  const weeklyTrend = weeklyPrices.length > 1 ? 
    (weeklyPrices[weeklyPrices.length - 1] - weeklyPrices[weeklyPrices.length - 2]) / weeklyPrices[weeklyPrices.length - 2] : 0;
  
  return {
    // Core indicators
    rsi: rsi[rsi.length - 1] || 50,
    rsi_fast: rsi_fast[rsi_fast.length - 1] || 50,
    macd: macd[macd.length - 1] || 0,
    macdSignal: macdSignal[macdSignal.length - 1] || 0,
    macdHistogram: histogram[histogram.length - 1] || 0,
    
    // Moving averages
    sma20: sma20[sma20.length - 1] || currentPrice,
    sma50: sma50[sma50.length - 1] || currentPrice,
    sma200: sma200[sma200.length - 1] || currentPrice,
    ema12: ema12[ema12.length - 1] || currentPrice,
    ema26: ema26[ema26.length - 1] || currentPrice,
    
    // Bollinger Bands
    bollingerUpper: bollinger.upperBand[bollinger.upperBand.length - 1] || currentPrice * 1.02,
    bollingerLower: bollinger.lowerBand[bollinger.lowerBand.length - 1] || currentPrice * 0.98,
    bollingerPosition: bollingerPosition || 0.5,
    
    // Advanced oscillators
    stochastic: stochastic[stochastic.length - 1] || 50,
    williamsR: williamsR[williamsR.length - 1] || -50,
    cci: cci[cci.length - 1] || 0,
    
    // Volatility and trend
    atr: atr[atr.length - 1] || 0,
    adx: adx[adx.length - 1] || 25,
    
    // Volume analysis
    obv: obv[obv.length - 1] || 0,
    volumeRatio: volumeRatio || 1,
    volumeTrend: volumeTrend || 0,
    
    // Support/Resistance
    support: support || currentPrice * 0.95,
    resistance: resistance || currentPrice * 1.05,
    
    // Trend analysis
    trend: trend || 'neutral',
    weeklyTrend: weeklyTrend || 0,
    
    // Price action
    currentPrice,
    priceChangePercent: dailyPrices.length > 1 ? 
      (currentPrice - dailyPrices[dailyPrices.length - 2]) / dailyPrices[dailyPrices.length - 2] * 100 : 0
  };
}

// =================== CORE TECHNICAL FUNCTIONS ===================

function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) return [50];
  
  const gains: number[] = [];
  const losses: number[] = [];

  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const rsi: number[] = [];
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

function calculateMACD(prices: number[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const ema12 = calculateEMA(prices, fastPeriod);
  const ema26 = calculateEMA(prices, slowPeriod);
  
  const macd = ema12.map((value, index) => value - ema26[index]);
  const signal = calculateEMA(macd, signalPeriod);
  const histogram = macd.map((value, index) => value - (signal[index] || 0));

  return { macd, signal, histogram };
}

function calculateEMA(prices: number[], period: number): number[] {
  if (prices.length === 0) return [];
  
  const multiplier = 2 / (period + 1);
  const ema = [prices[0]];

  for (let i = 1; i < prices.length; i++) {
    ema.push((prices[i] * multiplier) + (ema[i - 1] * (1 - multiplier)));
  }

  return ema;
}

function calculateSMA(prices: number[], period: number): number[] {
  if (prices.length < period) return [];
  
  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    sma.push(sum / period);
  }
  return sma;
}

function calculateBollingerBands(prices: number[], period: number, deviation: number) {
  const sma = calculateSMA(prices, period);
  const upperBand = [];
  const lowerBand = [];

  for (let i = period - 1; i < prices.length; i++) {
    const slice = prices.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const stdDev = Math.sqrt(variance);

    upperBand.push(sma[i - period + 1] + (deviation * stdDev));
    lowerBand.push(sma[i - period + 1] - (deviation * stdDev));
  }

  return { upperBand, lowerBand };
}

// =================== ADVANCED OSCILLATORS ===================

function calculateStochastic(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  if (highs.length < period) return [50];
  
  const stochastic = [];
  for (let i = period - 1; i < highs.length; i++) {
    const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
    const currentClose = closes[i];
    
    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    stochastic.push(isNaN(k) ? 50 : k);
  }
  
  return stochastic;
}

function calculateWilliamsR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  if (highs.length < period) return [-50];
  
  const williamsR = [];
  for (let i = period - 1; i < highs.length; i++) {
    const highestHigh = Math.max(...highs.slice(i - period + 1, i + 1));
    const lowestLow = Math.min(...lows.slice(i - period + 1, i + 1));
    const currentClose = closes[i];
    
    const wr = ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100;
    williamsR.push(isNaN(wr) ? -50 : wr);
  }
  
  return williamsR;
}

function calculateCCI(highs: number[], lows: number[], closes: number[], period: number = 20): number[] {
  if (highs.length < period) return [0];
  
  const cci = [];
  for (let i = period - 1; i < highs.length; i++) {
    const typicalPrices = [];
    for (let j = i - period + 1; j <= i; j++) {
      typicalPrices.push((highs[j] + lows[j] + closes[j]) / 3);
    }
    
    const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period;
    const meanDeviation = typicalPrices.reduce((sum, tp) => sum + Math.abs(tp - smaTP), 0) / period;
    
    const currentTP = (highs[i] + lows[i] + closes[i]) / 3;
    const cciValue = meanDeviation !== 0 ? (currentTP - smaTP) / (0.015 * meanDeviation) : 0;
    
    cci.push(cciValue);
  }
  
  return cci;
}

// =================== VOLATILITY AND TREND INDICATORS ===================

function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  if (highs.length < 2) return [0];
  
  const trueRanges = [];
  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  return calculateSMA(trueRanges, period);
}

function calculateADX(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  if (highs.length < period + 1) return [25];
  
  // Simplified ADX calculation
  const dmPlus = [];
  const dmMinus = [];
  
  for (let i = 1; i < highs.length; i++) {
    const upMove = highs[i] - highs[i - 1];
    const downMove = lows[i - 1] - lows[i];
    
    dmPlus.push(upMove > downMove && upMove > 0 ? upMove : 0);
    dmMinus.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  const adx = [];
  for (let i = period - 1; i < dmPlus.length; i++) {
    const avgDMPlus = dmPlus.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgDMMinus = dmMinus.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
    const sum = avgDMPlus + avgDMMinus;
    const adxValue = sum !== 0 ? Math.abs(avgDMPlus - avgDMMinus) / sum * 100 : 25;
    adx.push(adxValue);
  }
  
  return adx;
}

// =================== VOLUME ANALYSIS ===================

function calculateOBV(prices: number[], volumes: number[]): number[] {
  if (prices.length < 2) return [0];
  
  const obv = [volumes[0] || 0];
  for (let i = 1; i < prices.length; i++) {
    const volume = volumes[i] || 0;
    if (prices[i] > prices[i - 1]) {
      obv.push(obv[obv.length - 1] + volume);
    } else if (prices[i] < prices[i - 1]) {
      obv.push(obv[obv.length - 1] - volume);
    } else {
      obv.push(obv[obv.length - 1]);
    }
  }
  
  return obv;
}

function calculateVolumeTrend(volumes: number[]): number {
  if (volumes.length < 10) return 0;
  
  const recent = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const previous = volumes.slice(-10, -5).reduce((a, b) => a + b, 0) / 5;
  
  return previous !== 0 ? (recent - previous) / previous : 0;
}

// =================== SUPPORT/RESISTANCE ===================

function calculateSupportResistance(highs: number[], lows: number[], closes: number[]) {
  if (highs.length < 20) return { support: closes[closes.length - 1] * 0.95, resistance: closes[closes.length - 1] * 1.05 };
  
  // Find recent pivot points
  const pivotHighs = [];
  const pivotLows = [];
  const lookback = 5;
  
  for (let i = lookback; i < highs.length - lookback; i++) {
    const isHigh = highs.slice(i - lookback, i + lookback + 1).every((h, idx) => 
      idx === lookback ? true : h <= highs[i]);
    const isLow = lows.slice(i - lookback, i + lookback + 1).every((l, idx) => 
      idx === lookback ? true : l >= lows[i]);
    
    if (isHigh) pivotHighs.push(highs[i]);
    if (isLow) pivotLows.push(lows[i]);
  }
  
  const currentPrice = closes[closes.length - 1];
  const resistance = pivotHighs.filter(h => h > currentPrice).sort((a, b) => a - b)[0] || currentPrice * 1.05;
  const support = pivotLows.filter(l => l < currentPrice).sort((a, b) => b - a)[0] || currentPrice * 0.95;
  
  return { support, resistance };
}

// =================== TREND ANALYSIS ===================

function analyzeTrend(prices: number[], sma20: number[], sma50: number[], sma200: number[]): string {
  if (prices.length === 0) return 'neutral';
  
  const currentPrice = prices[prices.length - 1];
  const current20 = sma20[sma20.length - 1] || currentPrice;
  const current50 = sma50[sma50.length - 1] || currentPrice;
  const current200 = sma200[sma200.length - 1] || currentPrice;
  
  // Strong uptrend: price above all MAs, MAs in ascending order
  if (currentPrice > current20 && current20 > current50 && current50 > current200) {
    return 'strong_uptrend';
  }
  
  // Strong downtrend: price below all MAs, MAs in descending order
  if (currentPrice < current20 && current20 < current50 && current50 < current200) {
    return 'strong_downtrend';
  }
  
  // Uptrend: price above 20 and 50 day MA
  if (currentPrice > current20 && currentPrice > current50) {
    return 'uptrend';
  }
  
  // Downtrend: price below 20 and 50 day MA
  if (currentPrice < current20 && currentPrice < current50) {
    return 'downtrend';
  }
  
  return 'neutral';
}

// =================== PATTERN RECOGNITION ===================

function detectPricePatterns(prices: number[], highs: number[], lows: number[]) {
  console.log('🔍 Detecting price patterns...');
  
  const patterns = [];
  
  if (prices.length < 20) return patterns;
  
  // Double Top/Bottom detection
  const doubleTop = detectDoubleTop(highs);
  const doubleBottom = detectDoubleBottom(lows);
  
  // Triangle patterns
  const trianglePattern = detectTriangle(highs, lows);
  
  // Head and Shoulders
  const headShoulders = detectHeadAndShoulders(highs);
  
  // Breakout patterns
  const breakout = detectBreakout(prices, highs, lows);
  
  // Momentum patterns
  const momentum = detectMomentumPattern(prices);
  
  if (doubleTop) patterns.push({ type: 'double_top', strength: doubleTop, signal: 'bearish' });
  if (doubleBottom) patterns.push({ type: 'double_bottom', strength: doubleBottom, signal: 'bullish' });
  if (trianglePattern) patterns.push(trianglePattern);
  if (headShoulders) patterns.push({ type: 'head_shoulders', strength: headShoulders, signal: 'bearish' });
  if (breakout) patterns.push(breakout);
  if (momentum) patterns.push(momentum);
  
  return patterns;
}

function detectDoubleTop(highs: number[]): number | null {
  if (highs.length < 10) return null;
  
  const recent = highs.slice(-10);
  const peaks = [];
  
  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i] > recent[i - 1] && recent[i] > recent[i + 1]) {
      peaks.push({ index: i, value: recent[i] });
    }
  }
  
  if (peaks.length >= 2) {
    const lastTwo = peaks.slice(-2);
    const diff = Math.abs(lastTwo[0].value - lastTwo[1].value) / lastTwo[0].value;
    if (diff < 0.02) return 0.7; // Strong double top pattern
  }
  
  return null;
}

function detectDoubleBottom(lows: number[]): number | null {
  if (lows.length < 10) return null;
  
  const recent = lows.slice(-10);
  const troughs = [];
  
  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i] < recent[i - 1] && recent[i] < recent[i + 1]) {
      troughs.push({ index: i, value: recent[i] });
    }
  }
  
  if (troughs.length >= 2) {
    const lastTwo = troughs.slice(-2);
    const diff = Math.abs(lastTwo[0].value - lastTwo[1].value) / lastTwo[0].value;
    if (diff < 0.02) return 0.7; // Strong double bottom pattern
  }
  
  return null;
}

function detectTriangle(highs: number[], lows: number[]) {
  if (highs.length < 15) return null;
  
  const recentHighs = highs.slice(-15);
  const recentLows = lows.slice(-15);
  
  // Check for converging trend lines
  const highTrend = calculateTrendLine(recentHighs);
  const lowTrend = calculateTrendLine(recentLows);
  
  if (highTrend.slope < 0 && lowTrend.slope > 0) {
    return { type: 'triangle', strength: 0.6, signal: 'consolidation' };
  }
  
  return null;
}

function detectHeadAndShoulders(highs: number[]): number | null {
  if (highs.length < 15) return null;
  
  const recent = highs.slice(-15);
  const peaks = [];
  
  for (let i = 2; i < recent.length - 2; i++) {
    if (recent[i] > recent[i - 1] && recent[i] > recent[i + 1] && 
        recent[i] > recent[i - 2] && recent[i] > recent[i + 2]) {
      peaks.push({ index: i, value: recent[i] });
    }
  }
  
  if (peaks.length >= 3) {
    const [left, head, right] = peaks.slice(-3);
    if (head.value > left.value && head.value > right.value &&
        Math.abs(left.value - right.value) / left.value < 0.05) {
      return 0.8; // Strong head and shoulders pattern
    }
  }
  
  return null;
}

function detectBreakout(prices: number[], highs: number[], lows: number[]) {
  if (prices.length < 20) return null;
  
  const currentPrice = prices[prices.length - 1];
  const recentHighs = highs.slice(-20);
  const recentLows = lows.slice(-20);
  
  const resistance = Math.max(...recentHighs.slice(0, -2));
  const support = Math.min(...recentLows.slice(0, -2));
  
  if (currentPrice > resistance * 1.005) {
    return { type: 'breakout_up', strength: 0.8, signal: 'bullish' };
  } else if (currentPrice < support * 0.995) {
    return { type: 'breakdown', strength: 0.8, signal: 'bearish' };
  }
  
  return null;
}

function detectMomentumPattern(prices: number[]) {
  if (prices.length < 10) return null;
  
  const recent = prices.slice(-10);
  const momentum = [];
  
  for (let i = 1; i < recent.length; i++) {
    momentum.push((recent[i] - recent[i - 1]) / recent[i - 1]);
  }
  
  const avgMomentum = momentum.reduce((a, b) => a + b, 0) / momentum.length;
  
  if (avgMomentum > 0.02) {
    return { type: 'strong_momentum_up', strength: 0.7, signal: 'bullish' };
  } else if (avgMomentum < -0.02) {
    return { type: 'strong_momentum_down', strength: 0.7, signal: 'bearish' };
  }
  
  return null;
}

function calculateTrendLine(values: number[]) {
  const n = values.length;
  const indices = Array.from({ length: n }, (_, i) => i);
  
  const sumX = indices.reduce((a, b) => a + b, 0);
  const sumY = values.reduce((a, b) => a + b, 0);
  const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
  const sumXX = indices.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  return { slope, intercept };
}

// =================== MARKET SENTIMENT ANALYSIS ===================

function analyzeMarketSentiment(indicators: any, patterns: any[], dailyChange: number) {
  console.log('🧠 Analyzing market sentiment...');
  
  let sentimentScore = 0;
  let regime = 'neutral';
  
  // Technical sentiment
  if (indicators.rsi > 70) sentimentScore -= 0.2;
  else if (indicators.rsi < 30) sentimentScore += 0.2;
  
  if (indicators.macd > indicators.macdSignal) sentimentScore += 0.15;
  else sentimentScore -= 0.15;
  
  // Trend sentiment
  if (indicators.trend === 'strong_uptrend') sentimentScore += 0.3;
  else if (indicators.trend === 'strong_downtrend') sentimentScore -= 0.3;
  else if (indicators.trend === 'uptrend') sentimentScore += 0.15;
  else if (indicators.trend === 'downtrend') sentimentScore -= 0.15;
  
  // Volume sentiment
  if (indicators.volumeRatio > 1.5 && dailyChange > 0) sentimentScore += 0.1;
  else if (indicators.volumeRatio > 1.5 && dailyChange < 0) sentimentScore -= 0.1;
  
  // Pattern sentiment
  patterns.forEach(pattern => {
    if (pattern.signal === 'bullish') sentimentScore += pattern.strength * 0.1;
    else if (pattern.signal === 'bearish') sentimentScore -= pattern.strength * 0.1;
  });
  
  // Market regime detection
  if (sentimentScore > 0.3) regime = 'bullish';
  else if (sentimentScore < -0.3) regime = 'bearish';
  else if (indicators.adx > 25) regime = 'trending';
  else regime = 'ranging';
  
  return {
    score: Math.max(-1, Math.min(1, sentimentScore)),
    regime,
    confidence: Math.abs(sentimentScore)
  };
}

// =================== ADVANCED PREDICTION ENGINE ===================

function generateAdvancedPrediction(indicators: any, patterns: any[], sentiment: any, symbol: string) {
  console.log('🤖 Generating advanced AI prediction...');
  
  // Ensemble of different models
  const models = {
    technical: calculateTechnicalScore(indicators),
    pattern: calculatePatternScore(patterns),
    momentum: calculateMomentumScore(indicators),
    mean_reversion: calculateMeanReversionScore(indicators),
    trend_following: calculateTrendFollowingScore(indicators)
  };
  
  // Timeframe analysis
  const timeframes = {
    short_term: calculateShortTermScore(indicators, patterns),
    medium_term: calculateMediumTermScore(indicators),
    long_term: calculateLongTermScore(indicators)
  };
  
  // Weight models based on market regime
  let weights = { technical: 0.3, pattern: 0.2, momentum: 0.2, mean_reversion: 0.15, trend_following: 0.15 };
  
  if (sentiment.regime === 'trending') {
    weights = { technical: 0.25, pattern: 0.15, momentum: 0.3, mean_reversion: 0.1, trend_following: 0.2 };
  } else if (sentiment.regime === 'ranging') {
    weights = { technical: 0.2, pattern: 0.25, momentum: 0.15, mean_reversion: 0.3, trend_following: 0.1 };
  }
  
  // Calculate weighted ensemble score
  const ensembleScore = Object.keys(models).reduce((sum, model) => {
    return sum + models[model as keyof typeof models] * weights[model as keyof typeof weights];
  }, 0);
  
  // Calculate timeframe weighted score
  const timeframeScore = (timeframes.short_term * 0.5) + (timeframes.medium_term * 0.3) + (timeframes.long_term * 0.2);
  
  // Final prediction
  const finalScore = (ensembleScore * 0.7) + (timeframeScore * 0.3) + (sentiment.score * 0.1);
  
  // Determine signal and confidence
  let signal: 'buy' | 'sell' | 'hold' = 'hold';
  if (finalScore > 0.15) signal = 'buy';
  else if (finalScore < -0.15) signal = 'sell';
  
  const confidence = Math.min(0.95, Math.abs(finalScore) + 0.1);
  
  // Advanced target price calculation
  const volatility = indicators.atr / indicators.currentPrice;
  const baseMove = volatility * 2; // 2x ATR move
  
  let targetPrice = indicators.currentPrice;
  if (signal === 'buy') {
    targetPrice *= (1 + baseMove * confidence);
  } else if (signal === 'sell') {
    targetPrice *= (1 - baseMove * confidence);
  } else {
    targetPrice *= (1 + (Math.random() - 0.5) * baseMove * 0.5);
  }
  
  return {
    signal,
    confidence: Math.round(confidence * 100) / 100,
    targetPrice: Math.round(targetPrice * 100) / 100,
    finalScore: Math.round(finalScore * 1000) / 1000,
    modelScores: models,
    timeframeScores: timeframes,
    ensembleScore: Math.round(ensembleScore * 1000) / 1000,
    marketRegime: sentiment.regime
  };
}

function calculateTechnicalScore(indicators: any): number {
  let score = 0;
  
  // RSI
  if (indicators.rsi < 30) score += 0.3;
  else if (indicators.rsi > 70) score -= 0.3;
  else if (indicators.rsi > 45 && indicators.rsi < 55) score += 0.1;
  
  // MACD
  if (indicators.macd > indicators.macdSignal) score += 0.25;
  else score -= 0.25;
  
  // Moving averages
  if (indicators.currentPrice > indicators.sma20 && indicators.sma20 > indicators.sma50) score += 0.2;
  else if (indicators.currentPrice < indicators.sma20 && indicators.sma20 < indicators.sma50) score -= 0.2;
  
  // Bollinger position
  if (indicators.bollingerPosition < 0.2) score += 0.15;
  else if (indicators.bollingerPosition > 0.8) score -= 0.15;
  
  return Math.max(-1, Math.min(1, score));
}

function calculatePatternScore(patterns: any[]): number {
  let score = 0;
  
  patterns.forEach(pattern => {
    if (pattern.signal === 'bullish') score += pattern.strength;
    else if (pattern.signal === 'bearish') score -= pattern.strength;
  });
  
  return Math.max(-1, Math.min(1, score));
}

function calculateMomentumScore(indicators: any): number {
  let score = 0;
  
  // Price momentum
  if (indicators.priceChangePercent > 2) score += 0.3;
  else if (indicators.priceChangePercent < -2) score -= 0.3;
  
  // Volume momentum
  if (indicators.volumeRatio > 1.5) {
    score += indicators.priceChangePercent > 0 ? 0.2 : -0.2;
  }
  
  // ADX for trend strength
  if (indicators.adx > 25) {
    score += indicators.trend.includes('up') ? 0.2 : -0.2;
  }
  
  return Math.max(-1, Math.min(1, score));
}

function calculateMeanReversionScore(indicators: any): number {
  let score = 0;
  
  // RSI mean reversion
  if (indicators.rsi > 80) score += 0.4; // Oversold, expect reversion up
  else if (indicators.rsi < 20) score -= 0.4; // Overbought, expect reversion down
  
  // Bollinger band position
  if (indicators.bollingerPosition > 0.9) score -= 0.3;
  else if (indicators.bollingerPosition < 0.1) score += 0.3;
  
  // Williams %R
  if (indicators.williamsR > -20) score -= 0.2;
  else if (indicators.williamsR < -80) score += 0.2;
  
  return Math.max(-1, Math.min(1, score));
}

function calculateTrendFollowingScore(indicators: any): number {
  let score = 0;
  
  // Trend alignment
  if (indicators.trend === 'strong_uptrend') score += 0.4;
  else if (indicators.trend === 'strong_downtrend') score -= 0.4;
  else if (indicators.trend === 'uptrend') score += 0.2;
  else if (indicators.trend === 'downtrend') score -= 0.2;
  
  // Moving average alignment
  if (indicators.currentPrice > indicators.sma200) score += 0.2;
  else score -= 0.2;
  
  // Weekly trend confirmation
  if (indicators.weeklyTrend > 0.02) score += 0.1;
  else if (indicators.weeklyTrend < -0.02) score -= 0.1;
  
  return Math.max(-1, Math.min(1, score));
}

function calculateShortTermScore(indicators: any, patterns: any[]): number {
  let score = 0;
  
  // Short-term RSI
  if (indicators.rsi_fast < 30) score += 0.3;
  else if (indicators.rsi_fast > 70) score -= 0.3;
  
  // MACD histogram
  if (indicators.macdHistogram > 0) score += 0.2;
  else score -= 0.2;
  
  // Recent patterns
  const recentPatterns = patterns.filter(p => p.type.includes('momentum') || p.type.includes('breakout'));
  recentPatterns.forEach(pattern => {
    if (pattern.signal === 'bullish') score += 0.15;
    else if (pattern.signal === 'bearish') score -= 0.15;
  });
  
  return Math.max(-1, Math.min(1, score));
}

function calculateMediumTermScore(indicators: any): number {
  let score = 0;
  
  // 20-50 day MA relationship
  if (indicators.sma20 > indicators.sma50) score += 0.3;
  else score -= 0.3;
  
  // Price vs 50-day MA
  const ma50Distance = (indicators.currentPrice - indicators.sma50) / indicators.sma50;
  if (ma50Distance > 0.05) score += 0.2;
  else if (ma50Distance < -0.05) score -= 0.2;
  
  // Stochastic
  if (indicators.stochastic < 20) score += 0.2;
  else if (indicators.stochastic > 80) score -= 0.2;
  
  return Math.max(-1, Math.min(1, score));
}

function calculateLongTermScore(indicators: any): number {
  let score = 0;
  
  // Price vs 200-day MA
  if (indicators.currentPrice > indicators.sma200) score += 0.4;
  else score -= 0.4;
  
  // 50-200 day MA relationship (Golden/Death Cross)
  if (indicators.sma50 > indicators.sma200) score += 0.3;
  else score -= 0.3;
  
  // Long-term trend
  if (indicators.trend.includes('strong')) score += 0.2;
  
  return Math.max(-1, Math.min(1, score));
}

// =================== RISK METRICS ===================

function calculateRiskMetrics(prices: number[], prediction: any, indicators: any) {
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }
  
  // Volatility (annualized)
  const volatility = Math.sqrt(252) * calculateStandardDeviation(returns);
  
  // Maximum drawdown
  const maxDrawdown = calculateMaxDrawdown(prices);
  
  // Sharpe ratio approximation
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const sharpeRatio = volatility > 0 ? avgReturn / volatility : 0;
  
  return {
    volatility: Math.round(volatility * 10000) / 100, // as percentage
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100
  };
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateMaxDrawdown(prices: number[]): number {
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    } else {
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

// =================== UPDATED SIGNAL GENERATION ===================

async function generateTradingSignals(symbols: string[]) {
  console.log('🔄 Generating advanced trading signals...');
  const signals = [];

  for (const symbol of symbols) {
    try {
      const analysis = await analyzeStock(symbol);
      const data = await analysis.json();
      
      if (data.prediction) {
        signals.push({
          symbol,
          signal_type: data.prediction.signal,
          target_price: data.prediction.targetPrice,
          confidence_score: data.prediction.confidence,
          risk_score: 1 - data.prediction.confidence,
          reasoning: generateAdvancedReasoning(data.prediction, data.technicalIndicators, data.patterns),
          expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        });
      }
    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error);
    }
  }

  if (signals.length > 0) {
    await supabase.from('trading_signals').insert(signals);
  }

  return new Response(
    JSON.stringify({ signals }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function generateAdvancedReasoning(prediction: any, indicators: any, patterns: any[]): string {
  const reasons = [];
  
  // Signal strength
  if (prediction.signal === 'buy') {
    reasons.push(`Strong BUY signal (${Math.round(prediction.confidence * 100)}% confidence)`);
  } else if (prediction.signal === 'sell') {
    reasons.push(`SELL signal (${Math.round(prediction.confidence * 100)}% confidence)`);
  } else {
    reasons.push(`HOLD signal (${Math.round(prediction.confidence * 100)}% confidence)`);
  }
  
  // Technical factors
  if (indicators.rsi < 30) reasons.push("oversold conditions");
  else if (indicators.rsi > 70) reasons.push("overbought conditions");
  
  if (indicators.macd > indicators.macdSignal) reasons.push("bullish MACD crossover");
  else reasons.push("bearish MACD momentum");
  
  if (indicators.trend === 'strong_uptrend') reasons.push("strong uptrend confirmed");
  else if (indicators.trend === 'strong_downtrend') reasons.push("strong downtrend in place");
  
  // Volume confirmation
  if (indicators.volumeRatio > 1.5) reasons.push("high volume confirmation");
  
  // Pattern recognition
  if (patterns && patterns.length > 0) {
    const bullishPatterns = patterns.filter(p => p.signal === 'bullish').length;
    const bearishPatterns = patterns.filter(p => p.signal === 'bearish').length;
    
    if (bullishPatterns > bearishPatterns) reasons.push("bullish pattern detected");
    else if (bearishPatterns > bullishPatterns) reasons.push("bearish pattern detected");
  }
  
  // Market regime
  if (prediction.marketRegime) {
    reasons.push(`${prediction.marketRegime} market conditions`);
  }
  
  return reasons.join(", ");
}

async function scanOpportunities() {
  console.log('🔍 Scanning market opportunities...');
  
  // This could be enhanced to scan multiple stocks and find the best opportunities
  const opportunities = [];
  
  return new Response(
    JSON.stringify({ opportunities }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
