import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, TrendingDown } from "lucide-react";

interface Trade {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
  timestamp: string;
  profitLoss?: number;
}

export function RecentTrades() {
  const recentTrades: Trade[] = [
    {
      id: "1",
      symbol: "AAPL",
      type: "buy",
      shares: 10,
      price: 182.41,
      total: 1824.10,
      timestamp: "2h ago",
    },
    {
      id: "2",
      symbol: "TSLA",
      type: "sell",
      shares: 5,
      price: 248.67,
      total: 1243.35,
      timestamp: "4h ago",
      profitLoss: 156.75,
    },
    {
      id: "3",
      symbol: "MSFT",
      type: "buy",
      shares: 6,
      price: 334.89,
      total: 2009.34,
      timestamp: "1d ago",
    },
    {
      id: "4",
      symbol: "GOOGL",
      type: "sell",
      shares: 3,
      price: 127.82,
      total: 383.46,
      timestamp: "1d ago",
      profitLoss: -24.18,
    },
    {
      id: "5",
      symbol: "NVDA",
      type: "buy",
      shares: 8,
      price: 467.83,
      total: 3742.64,
      timestamp: "2d ago",
    },
  ];

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Recent Trades
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentTrades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between p-2 rounded bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-2">
                {trade.type === 'buy' ? (
                  <TrendingUp className="h-3 w-3 profit" />
                ) : (
                  <TrendingDown className="h-3 w-3 loss" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{trade.symbol}</span>
                    <Badge variant="outline" className={`text-xs ${trade.type === 'buy' ? 'profit' : 'loss'} border-current`}>
                      {trade.type.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {trade.shares} shares @ ${trade.price.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-mono">${trade.total.toFixed(2)}</div>
                {trade.profitLoss !== undefined && (
                  <div className={`text-xs font-mono ${trade.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                    {trade.profitLoss >= 0 ? '+' : ''}${trade.profitLoss.toFixed(2)} P&L
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  {trade.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
