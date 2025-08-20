import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Briefcase, TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioPosition {
  symbol: string;
  shares: number;
  currentPrice: number;
  avgCost: number;
  value: number;
  profitLoss: number;
  profitLossPercent: number;
  allocation: number;
}

export function PortfolioSummary() {
  const positions: PortfolioPosition[] = [
    {
      symbol: "AAPL",
      shares: 25,
      currentPrice: 182.41,
      avgCost: 175.20,
      value: 4560.25,
      profitLoss: 180.25,
      profitLossPercent: 4.11,
      allocation: 35.5,
    },
    {
      symbol: "MSFT",
      shares: 12,
      currentPrice: 334.89,
      avgCost: 320.15,
      value: 4018.68,
      profitLoss: 176.88,
      profitLossPercent: 4.61,
      allocation: 31.3,
    },
    {
      symbol: "GOOGL",
      shares: 8,
      currentPrice: 127.82,
      avgCost: 132.45,
      value: 1022.56,
      profitLoss: -37.04,
      profitLossPercent: -3.50,
      allocation: 8.0,
    },
    {
      symbol: "TSLA",
      shares: 15,
      currentPrice: 248.67,
      avgCost: 265.30,
      value: 3730.05,
      profitLoss: -249.45,
      profitLossPercent: -6.27,
      allocation: 29.1,
    },
  ];

  const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0);
  const totalProfitLoss = positions.reduce((sum, pos) => sum + pos.profitLoss, 0);

  return (
    <Card className="trading-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Portfolio Holdings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Total Value</span>
            <div className="text-right">
              <div className="font-mono font-semibold">${totalValue.toLocaleString()}</div>
              <div className={`text-xs font-mono ${totalProfitLoss >= 0 ? 'profit' : 'loss'}`}>
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)}
              </div>
            </div>
          </div>

          {positions.map((position) => (
            <div key={position.symbol} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{position.symbol}</span>
                  {position.profitLoss >= 0 ? (
                    <TrendingUp className="h-3 w-3 profit" />
                  ) : (
                    <TrendingDown className="h-3 w-3 loss" />
                  )}
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm">${position.value.toLocaleString()}</div>
                  <div className={`text-xs font-mono ${position.profitLoss >= 0 ? 'profit' : 'loss'}`}>
                    {position.profitLoss >= 0 ? '+' : ''}${position.profitLoss.toFixed(2)} ({position.profitLossPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{position.shares} shares @ ${position.currentPrice.toFixed(2)}</span>
                <span>•</span>
                <span>Avg: ${position.avgCost.toFixed(2)}</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Progress value={position.allocation} className="flex-1 h-2" />
                <span className="text-xs text-muted-foreground w-12">
                  {position.allocation.toFixed(1)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
