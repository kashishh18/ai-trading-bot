import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, TrendingDown, Brain, Clock } from "lucide-react";

interface TradingSignal {
  id: string;
  symbol: string;
  type: 'buy' | 'sell' | 'hold';
  confidence: number;
  targetPrice: number;
  currentPrice: number;
  reasoning: string;
  timeLeft: string;
  riskScore: number;
}

export function TradingSignals() {
  const signals: TradingSignal[] = [
    {
      id: "1",
      symbol: "NVDA",
      type: "buy",
      confidence: 87,
      targetPrice: 485.20,
      currentPrice: 467.83,
      reasoning: "Strong momentum, bullish technical indicators",
      timeLeft: "2h 15m",
      riskScore: 0.32,
    },
    {
      id: "2",
      symbol: "META",
      type: "sell",
      confidence: 74,
      targetPrice: 298.50,
      currentPrice: 312.45,
      reasoning: "Overbought conditions, resistance level",
      timeLeft: "4h 32m",
      riskScore: 0.28,
    },
    {
      id: "3",
      symbol: "AMD",
      type: "buy",
      confidence: 92,
      targetPrice: 156.80,
      currentPrice: 147.92,
      reasoning: "Breakout pattern, high volume confirmation",
      timeLeft: "1h 47m",
      riskScore: 0.25,
    },
  ];

  const getSignalColor = (type: string) => {
    switch (type) {
      case "buy": return "profit";
      case "sell": return "loss";
      default: return "neutral";
    }
  };

  const getSignalIcon = (type: string) => {
    switch (type) {
      case "buy": return TrendingUp;
      case "sell": return TrendingDown;
      default: return Target;
    }
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Trading Signals
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {signals.map((signal) => {
            const SignalIcon = getSignalIcon(signal.type);
            const potentialReturn = ((signal.targetPrice - signal.currentPrice) / signal.currentPrice * 100);
            
            return (
              <div key={signal.id} className="p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <SignalIcon className={`h-4 w-4 ${getSignalColor(signal.type)}`} />
                    <span className="font-semibold">{signal.symbol}</span>
                    <Badge variant="outline" className={`${getSignalColor(signal.type)} border-current text-xs`}>
                      {signal.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      {signal.confidence}% confidence
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {signal.timeLeft}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                  <div>
                    <span className="text-muted-foreground">Current: </span>
                    <span className="font-mono">${signal.currentPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Target: </span>
                    <span className="font-mono">${signal.targetPrice.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Potential: </span>
                    <span className={`font-mono ${potentialReturn >= 0 ? 'profit' : 'loss'}`}>
                      {potentialReturn >= 0 ? '+' : ''}{potentialReturn.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Risk: </span>
                    <span className={`font-mono ${signal.riskScore <= 0.3 ? 'profit' : signal.riskScore <= 0.6 ? 'neutral' : 'loss'}`}>
                      {(signal.riskScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground mb-3">
                  {signal.reasoning}
                </p>
                
                <Button size="sm" className="w-full trading-button">
                  Execute Trade
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
