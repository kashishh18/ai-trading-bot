import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock, Brain, Trash2 } from "lucide-react";
import AIAnalysisModal from "@/components/analysis/AIAnalysisModal";
import MarketStatusBar from "@/components/market/MarketStatusBar";

interface Prediction {
  id: string;
  symbol: string;
  predicted_price: number;
  confidence_score: number;
  signal_type: 'buy' | 'sell' | 'hold';
  created_at: string;
  expires_at: string;
  technical_indicators: any;
}

interface CurrentQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function Predictions() {
  const [searchSymbol, setSearchSymbol] = useState("");
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [currentQuotes, setCurrentQuotes] = useState<{[key: string]: CurrentQuote}>({});
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  useEffect(() => {
    initializePage();
  }, []);

  const initializePage = async () => {
    setLoading(true);
    
    // First try to fetch existing predictions
    const { data: existingPredictions } = await supabase
      .from('ai_predictions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!existingPredictions || existingPredictions.length === 0) {
      // If no predictions exist, generate some for trending stocks
      await generateTrendingStocksPredictions();
    } else {
      setPredictions(existingPredictions);
      // Fetch current quotes for existing predictions
      const symbols = [...new Set(existingPredictions.map(p => p.symbol))];
      await fetchCurrentQuotes(symbols);
    }
    
    setLoading(false);
  };

  const generateTrendingStocksPredictions = async () => {
    // Daily rotating trending stocks
    const allTrendingStocks = [
      ['AAPL', 'NVDA', 'TSLA'],
      ['MSFT', 'GOOGL', 'META'], 
      ['AMZN', 'NFLX', 'AMD'],
      ['BABA', 'TSM', 'ASML'],
      ['JPM', 'V', 'MA']
    ];
    
    // Rotate based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const todaysTrending = allTrendingStocks[dayOfYear % allTrendingStocks.length];
    
    console.log('Generating predictions for trending stocks:', todaysTrending);
    
    for (const symbol of todaysTrending) {
      try {
        await supabase.functions.invoke('ai-trading-analysis', {
          body: {
            action: 'analyze_stock',
            symbol
          }
        });
      } catch (error) {
        console.error(`Error analyzing trending stock ${symbol}:`, error);
      }
    }
    
    // Fetch the newly created predictions
    await fetchPredictions();
  };

  const fetchPredictions = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      setPredictions(data || []);
      
      // Fetch current quotes for all symbols
      if (data && data.length > 0) {
        const symbols = [...new Set(data.map(p => p.symbol))];
        await fetchCurrentQuotes(symbols);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchCurrentQuotes = async (symbols: string[]) => {
    try {
      const { data, error } = await supabase.functions.invoke('yahoo-finance-data', {
        body: {
          action: 'current_quotes',
          symbols: symbols
        }
      });

      if (error) throw error;
      
      const quotesMap = (data.quotes || []).reduce((acc: any, quote: any) => {
        acc[quote.symbol] = quote;
        return acc;
      }, {});
      
      setCurrentQuotes(quotesMap);
    } catch (error) {
      console.error('Error fetching current quotes:', error);
    }
  };

  const analyzeStock = async () => {
    if (!searchSymbol.trim()) return;
    
    setAnalyzing(true);
    try {
      let symbolToAnalyze = searchSymbol.toUpperCase();
      
      // First try to search for the symbol if it's not in stock symbol format
      if (searchSymbol.length > 5 || !/^[A-Z]{1,5}$/.test(searchSymbol.toUpperCase())) {
        try {
          const { data: searchData } = await supabase.functions.invoke('yahoo-finance-data', {
            body: {
              action: 'search_stocks',
              query: searchSymbol
            }
          });
          
          if (searchData?.results && searchData.results.length > 0) {
            symbolToAnalyze = searchData.results[0].symbol;
            console.log(`Found symbol: ${symbolToAnalyze} for search: ${searchSymbol}`);
          }
        } catch (searchError) {
          console.log('Search failed, trying original symbol:', searchError);
        }
      }

      const { data, error } = await supabase.functions.invoke('ai-trading-analysis', {
        body: {
          action: 'analyze_stock',
          symbol: symbolToAnalyze
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        return;
      }
      
      // Refresh predictions after analysis and clear search
      await fetchPredictions();
      setSearchSymbol("");
      
    } catch (error) {
      console.error('Error analyzing stock:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Add some sample data if no predictions exist
  const addSamplePredictions = async () => {
    const sampleSymbols = ['AAPL', 'MSFT', 'GOOGL'];
    setLoading(true);
    
    for (const symbol of sampleSymbols) {
      try {
        await supabase.functions.invoke('ai-trading-analysis', {
          body: {
            action: 'analyze_stock',
            symbol
          }
        });
      } catch (error) {
        console.error(`Error analyzing ${symbol}:`, error);
      }
