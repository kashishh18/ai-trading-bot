import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MarketData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: string;
}

export function MarketOverview() {
  const [marketData, setMarketData] = useState<MarketData[]>([
    { symbol: "SPY", name: "S&P 500 ETF", price: 427.83, change: 3.64, changePercent: 0.86, volume: "89.2M" },
    { symbol: "QQQ", name: "NASDAQ ETF", price: 367.29, change: 4.52, changePercent: 1.25, volume: "45.7M" },
    { symbol: "AAPL", name: "Apple Inc.", price: 182.41, change: -1.23, changePercent: -0.67, volume: "67.3M" },
    { symbol: "MSFT", name: "Microsoft", price: 334.89, change: 2.76, changePercent: 0.83, volume: "34.8M" },
    { symbol: "GOOGL", name: "Alphabet", price: 127.82, change: 1.94, changePercent: 1.54, volume: "28.9M" },
    { symbol: "TSLA", name: "Tesla", price: 248.67, change: -5.43, changePercent: -2.14, volume: "98.4M" },
  ]);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMarketData(prev => prev.map(stock => ({
        ...stock,
        price: stock.price + (Math.random() - 0.5) * 2,
        change: stock.change + (Math.random() - 0.5) * 0.5,
        changePercent: stock.changePercent + (Math.random() - 0.5) * 0.2,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Market Overview
          <Badge variant="outline" className="profit border-current ml-auto">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.map((stock) => (
            <div key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{stock.symbol}</span>
                    {stock.changePercent >= 0 ? (
                      <TrendingUp className="h-3 w-3 profit" />
                    ) : (
                      <TrendingDown className="h-3 w-3 loss" />
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{stock.name}</span>
                </div>
              </div>
              
              <div className="text-right">
                <div className="font-mono text-sm font-semibold">
                  ${stock.price.toFixed(2)}
                </div>
                <div className={`text-xs font-mono ${stock.changePercent >= 0 ? 'profit' : 'loss'}`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.change.toFixed(2)} ({stock.changePercent.toFixed(2)}%)
                </div>
                <div className="text-xs text-muted-foreground">
                  Vol: {stock.volume}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
