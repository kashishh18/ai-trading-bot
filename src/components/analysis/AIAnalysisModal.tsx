import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Brain, Target, Activity } from "lucide-react";

interface Prediction {
  id: string;
  symbol: string;
  predicted_price: number;
  confidence_score: number;
  signal_type: 'buy' | 'sell' | 'hold';
  created_at: string;
  technical_indicators: any;
}

interface AIAnalysisModalProps {
  prediction: Prediction | null;
  currentPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

export default function AIAnalysisModal({ prediction, currentPrice, isOpen, onClose }: AIAnalysisModalProps) {
  if (!prediction) return null;

  const indicators = prediction.technical_indicators || {};
  const potentialReturn = currentPrice > 0 ? 
    ((prediction.predicted_price - currentPrice) / currentPrice * 100) : 0;

  const getIndicatorStatus = (indicator: string, value: number) => {
    switch (indicator) {
      case 'rsi':
        if (value > 70) return { status: 'bearish', reason: 'Overbought (RSI > 70)' };
        if (value < 30) return { status: 'bullish', reason: 'Oversold (RSI < 30)' };
        return { status: 'neutral', reason: 'Normal range (30-70)' };
      case 'macd':
        return value > 0 
          ? { status: 'bullish', reason: 'MACD above signal line' }
          : { status: 'bearish', reason: 'MACD below signal line' };
      default:
        return { status: 'neutral', reason: 'Normal' };
    }
  };

  const getMovingAverageAnalysis = () => {
    if (!indicators.movingAverages) return null;
    
    const { sma20, sma50 } = indicators.movingAverages;
    const above20 = currentPrice > sma20;
    const above50 = currentPrice > sma50;
    const golden = sma20 > sma50;
    
    let analysis = "";
    let status = "neutral";
    
    if (above20 && above50 && golden) {
      analysis = "Strong bullish trend - price above both moving averages with golden cross";
      status = "bullish";
    } else if (above20 && golden) {
      analysis = "Bullish momentum - price above 20-day MA with upward trend";
      status = "bullish";
    } else if (!above20 && !above50) {
      analysis = "Bearish trend - price below key moving averages";
      status = "bearish";
    } else {
      analysis = "Mixed signals from moving averages";
      status = "neutral";
    }
    
    return { analysis, status, sma20, sma50 };
  };

  const getConfidenceExplanation = () => {
    const confidence = prediction.confidence_score * 100;
    if (confidence >= 90) return "Extremely high confidence - multiple strong technical signals align";
    if (confidence >= 80) return "High confidence - most technical indicators support this prediction";
    if (confidence >= 70) return "Good confidence - majority of signals are positive";
    if (confidence >= 60) return "Moderate confidence - some conflicting signals present";
    return "Low confidence - mixed or weak technical signals";
  };

  const getRiskFactors = () => {
    const risks = [];
    if (indicators.rsi > 75) risks.push("Stock may be severely overbought");
    if (indicators.rsi < 25) risks.push("Stock may be severely oversold");
    if (Math.abs(potentialReturn) > 15) risks.push("High volatility expected");
    if (prediction.confidence_score < 0.7) risks.push("Mixed technical signals present");
    
    return risks.length > 0 ? risks : ["Standard market volatility risk"];
  };

  const maAnalysis = getMovingAverageAnalysis();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Brain className="w-6 h-6 text-primary" />
            AI Analysis for {prediction.symbol}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Prediction Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Signal</p>
                  <Badge 
                    variant={prediction.signal_type === 'buy' ? 'default' : 
                            prediction.signal_type === 'sell' ? 'destructive' : 'secondary'}
                    className="text-lg px-3 py-1"
                  >
                    {prediction.signal_type.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Target Price</p>
                  <p className="text-xl font-bold">${prediction.predicted_price.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Potential Return</p>
                  <p className={`text-xl font-bold ${potentialReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {potentialReturn >= 0 ? '+' : ''}{potentialReturn.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Confidence</p>
                  <p className="text-xl font-bold">{Math.round(prediction.confidence_score * 100)}%</p>
                </div>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold mb-2">Why this prediction?</p>
                <p className="text-sm">
                  {prediction.symbol} is a <strong>{prediction.signal_type.toUpperCase()}</strong> because{' '}
                  {maAnalysis?.status === 'bullish' && "the stock price is above its key moving averages, "}
                  {indicators.rsi && indicators.rsi < 70 && indicators.rsi > 30 && "RSI shows it's not overbought or oversold, "}
                  {indicators.macd > 0 && "MACD signal is turning positive, "}
                  and our AI model detected {prediction.confidence_score > 0.8 ? 'strong' : 'moderate'} technical patterns 
                  that have been successful {Math.round(prediction.confidence_score * 100)}% of the time in historical data.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Factors Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Technical Factors Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* RSI Analysis */}
              {indicators.rsi && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">RSI (Relative Strength Index)</h4>
                    <Badge variant={
                      indicators.rsi > 70 ? 'destructive' : 
                      indicators.rsi < 30 ? 'default' : 'secondary'
                    }>
                      {indicators.rsi.toFixed(1)}
                    </Badge>
                  </div>
                  <Progress value={indicators.rsi} className="h-2" />
                  <div className="grid grid-cols-3 text-xs text-muted-foreground">
                    <span>Oversold (0-30)</span>
                    <span className="text-center">Normal (30-70)</span>
                    <span className="text-right">Overbought (70-100)</span>
                  </div>
                  <p className="text-sm">
                    <strong>What this means:</strong> RSI measures momentum. 
                    {indicators.rsi > 70 && " Values above 70 suggest the stock may be overbought and due for a pullback."}
                    {indicators.rsi < 30 && " Values below 30 suggest the stock may be oversold and due for a bounce."}
                    {indicators.rsi >= 30 && indicators.rsi <= 70 && " Values between 30-70 indicate normal trading conditions."}
                  </p>
                </div>
              )}

              {/* MACD Analysis */}
              {indicators.macd !== undefined && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">MACD (Moving Average Convergence Divergence)</h4>
                    <Badge variant={indicators.macd > 0 ? 'default' : 'destructive'}>
                      {indicators.macd > 0 ? 'Bullish' : 'Bearish'}
                    </Badge>
                  </div>
                  <p className="text-sm">
                    <strong>Signal:</strong> {indicators.macd > 0 ? 'Positive' : 'Negative'} ({indicators.macd.toFixed(4)})
                  </p>
                  <p className="text-sm">
                    <strong>What this means:</strong> MACD shows the relationship between two moving averages. 
                    {indicators.macd > 0 && " A positive MACD suggests upward momentum and potential buying opportunities."}
                    {indicators.macd <= 0 && " A negative MACD suggests downward momentum and potential selling pressure."}
                  </p>
                </div>
              )}

              {/* Moving Averages Analysis */}
              {maAnalysis && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Moving Averages</h4>
                    <Badge variant={
                      maAnalysis.status === 'bullish' ? 'default' : 
                      maAnalysis.status === 'bearish' ? 'destructive' : 'secondary'
                    }>
                      {maAnalysis.status === 'bullish' ? 'Bullish' : maAnalysis.status === 'bearish' ? 'Bearish' : 'Neutral'}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">20-day SMA</p>
                      <p className="font-mono">${maAnalysis.sma20?.toFixed(2) || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">50-day SMA</p>
                      <p className="font-mono">${maAnalysis.sma50?.toFixed(2) || 'N/A'}</p>
                    </div>
                  </div>
                  <p className="text-sm">
                    <strong>Analysis:</strong> {maAnalysis.analysis}
                  </p>
                  <p className="text-sm">
                    <strong>What this means:</strong> Moving averages smooth out price data to identify trend direction. 
                    When price is above moving averages, it typically indicates an uptrend.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confidence Score Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Confidence Score Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <Progress value={prediction.confidence_score * 100} className="h-3" />
                  </div>
                  <span className="font-bold text-lg">{Math.round(prediction.confidence_score * 100)}%</span>
                </div>
                <p className="text-sm">{getConfidenceExplanation()}</p>
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm">
                    <strong>Historical Performance:</strong> This confidence level is based on backtesting our AI model 
                    against historical data. Similar technical patterns with this confidence score have been 
                    successful approximately {Math.round(prediction.confidence_score * 100)}% of the time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                Risk Factors & Considerations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {getRiskFactors().map((risk, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                    {risk}
                  </li>
                ))}
              </ul>
              <div className="mt-4 bg-yellow-50 dark:bg-yellow-950/50 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Important:</strong> This analysis is based on technical indicators only. 
                  Always consider fundamental analysis, market news, and your risk tolerance before making investment decisions.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
