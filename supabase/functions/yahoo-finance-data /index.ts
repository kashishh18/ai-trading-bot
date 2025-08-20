import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YahooQuoteResponse {
  chart: {
    result: [{
      meta: {
        symbol: string;
        regularMarketPrice: number;
        previousClose: number;
        chartPreviousClose: number;
      };
      timestamp: number[];
      indicators: {
        quote: [{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }];
      };
    }];
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, symbols, period = '1d', interval = '1m' } = await req.json();

    switch (action) {
      case 'current_quotes':
        return await getCurrentQuotes(symbols);
      case 'historical_data':
        return await getHistoricalData(symbols[0], period, interval);
      case 'market_summary':
        return await getMarketSummary();
      case 'search_stocks':
        return await searchStocks(symbols[0]);
      default:
        throw new Error('Invalid action');
    }
  } catch (error) {
    console.error('Error in yahoo-finance-data function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function getCurrentQuotes(symbols: string[]) {
  const quotes = await Promise.all(
    symbols.map(async (symbol) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
      const response = await fetch(url);
      const data: YahooQuoteResponse = await response.json();
      
      if (!data.chart.result?.[0]) {
        throw new Error(`No data found for symbol: ${symbol}`);
      }

      const result = data.chart.result[0];
      const meta = result.meta;
      const lastTimestamp = result.timestamp[result.timestamp.length - 1];
      const quotes = result.indicators.quote[0];
      const lastIndex = quotes.close.length - 1;

      return {
        symbol,
        price: meta.regularMarketPrice || quotes.close[lastIndex],
        previousClose: meta.previousClose,
        change: (meta.regularMarketPrice || quotes.close[lastIndex]) - meta.previousClose,
        changePercent: ((meta.regularMarketPrice || quotes.close[lastIndex]) - meta.previousClose) / meta.previousClose * 100,
        volume: quotes.volume[lastIndex],
        timestamp: lastTimestamp,
        open: quotes.open[lastIndex],
        high: quotes.high[lastIndex],
        low: quotes.low[lastIndex],
      };
    })
  );

  // Store in database
  for (const quote of quotes) {
    await supabase.from('stock_prices').upsert({
      symbol: quote.symbol,
      date: new Date().toISOString().split('T')[0],
      open_price: quote.open,
      high_price: quote.high,
      low_price: quote.low,
      close_price: quote.price,
      volume: quote.volume,
      adjusted_close: quote.price,
    }, { onConflict: 'symbol,date' });
  }

  return new Response(
    JSON.stringify({ quotes }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getHistoricalData(symbol: string, period: string, interval: string) {
  const periodMap: { [key: string]: number } = {
    '1d': 1,
    '5d': 5,
    '1mo': 30,
    '3mo': 90,
    '6mo': 180,
    '1y': 365,
    '2y': 730,
    '5y': 1825,
  };

  const days = periodMap[period] || 30;
  const endTime = Math.floor(Date.now() / 1000);
  const startTime = endTime - (days * 24 * 60 * 60);

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?period1=${startTime}&period2=${endTime}&interval=${interval}`;
  const response = await fetch(url);
  const data: YahooQuoteResponse = await response.json();

  if (!data.chart.result?.[0]) {
    throw new Error(`No historical data found for symbol: ${symbol}`);
  }

  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const quotes = result.indicators.quote[0];

  const historicalData = timestamps.map((timestamp, index) => ({
    timestamp,
    date: new Date(timestamp * 1000).toISOString(),
    open: quotes.open[index],
    high: quotes.high[index],
    low: quotes.low[index],
    close: quotes.close[index],
    volume: quotes.volume[index],
  })).filter(item => item.open && item.high && item.low && item.close);

  return new Response(
    JSON.stringify({ symbol, data: historicalData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getMarketSummary() {
  const marketSymbols = ['^GSPC', '^DJI', '^IXIC', 'SPY', 'QQQ', 'IWM'];
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${marketSymbols.join(',')}`;
  
  const response = await fetch(url);
  const data = await response.json();

  const marketData = data.quoteResponse.result.map((quote: any) => ({
    symbol: quote.symbol,
    name: quote.longName || quote.shortName,
    price: quote.regularMarketPrice,
    change: quote.regularMarketChange,
    changePercent: quote.regularMarketChangePercent,
    volume: quote.regularMarketVolume,
    marketCap: quote.marketCap,
  }));

  return new Response(
    JSON.stringify({ marketData }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function searchStocks(query: string) {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  const data = await response.json();

  const results = data.quotes.slice(0, 10).map((quote: any) => ({
    symbol: quote.symbol,
    name: quote.longname || quote.shortname,
    exchange: quote.exchange,
    type: quote.typeDisp,
  }));

  return new Response(
    JSON.stringify({ results }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}
