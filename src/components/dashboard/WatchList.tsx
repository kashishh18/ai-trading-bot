import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Plus, X, TrendingUp, TrendingDown } from "lucide-react";

interface WatchListItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  alertPrice?: number;
}

export function WatchList() {
  const [watchList, setWatchList] = useState<WatchListItem[]>([
    { symbol: "NVDA", name: "NVIDIA Corp", price: 467.83, change: 12.45, changePercent: 2.74 },
    { symbol: "META", name: "Meta Platforms", price: 312.45, change: -4.32, changePercent: -1.36 },
    { symbol: "AMZN", name: "Amazon.com", price: 127.92, change: 1.87, changePercent: 1.48 },
    { symbol: "NFLX", name: "Netflix", price: 432.18, change: -2.15, changePercent: -0.49 },
  ]);
  
  const [newSymbol, setNewSymbol] = useState("");

  const addToWatchList = () => {
    if (newSymbol.trim()) {
      // In a real app, this would fetch the stock data
      const newItem: WatchListItem = {
        symbol: newSymbol.toUpperCase(),
        name: `${newSymbol.toUpperCase()} Inc.`,
        price: Math.random() * 200 + 50,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
      };
      setWatchList([...watchList, newItem]);
      setNewSymbol("");
    }
  };

  const removeFromWatchList = (symbol: string) => {
    setWatchList(watchList.filter(item => item.symbol !== symbol));
  };

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Watch List
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Add Symbol Input */}
          <div className="flex gap-2">
            <Input
              placeholder="Add symbol..."
              value={newSymbol}
              onChange={(e) => setNewSymbol(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addToWatchList()}
              className="text-xs"
            />
            <Button size="sm" onClick={addToWatchList} className="trading-button">
              <Plus className="h-3 w-3" />
            </Button>
          </div>

          {/* Watch List Items */}
          <div className="space-y-2">
            {watchList.map((item) => (
              <div key={item.symbol} className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors group">
                <div className="flex items-center gap-2">
                  {item.changePercent >= 0 ? (
                    <TrendingUp className="h-3 w-3 profit" />
                  ) : (
                    <TrendingDown className="h-3 w-3 loss" />
                  )}
                  <div>
                    <div className="text-sm font-semibold">{item.symbol}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-20">
                      {item.name}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-sm font-mono">${item.price.toFixed(2)}</div>
                  <div className={`text-xs font-mono ${item.changePercent >= 0 ? 'profit' : 'loss'}`}>
                    {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFromWatchList(item.symbol)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
