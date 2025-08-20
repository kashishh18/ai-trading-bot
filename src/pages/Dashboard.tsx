import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Target, Activity, AlertTriangle } from "lucide-react";
import { MarketOverview } from "@/components/dashboard/MarketOverview";
import { PortfolioSummary } from "@/components/dashboard/PortfolioSummary";
import { TradingSignals } from "@/components/dashboard/TradingSignals";
import { RecentTrades } from "@/components/dashboard/RecentTrades";
import { WatchList } from "@/components/dashboard/WatchList";

export default function Dashboard() {
  const [portfolioData, setPortfolioData] = useState({
    totalValue: 12847.52,
    dailyChange: 234.18,
    dailyChangePercent: 1.86,
    cashBalance: 3247.18,
    totalProfitLoss: 847.52,
  });

  const stats = [
    {
      title: "Portfolio Value",
      value: `$${portfolioData.totalValue.toLocaleString()}`,
      change: portfolioData.dailyChange,
      changePercent: portfolioData.dailyChangePercent,
      icon: DollarSign,
    },
    {
      title: "Daily P&L",
      value: `${portfolioData.dailyChange >= 0 ? '+' : ''}$${portfolioData.dailyChange.toFixed(2)}`,
      change: portfolioData.dailyChange,
      changePercent: portfolioData.dailyChangePercent,
      icon: portfolioData.dailyChange >= 0 ? TrendingUp : TrendingDown,
    },
    {
      title: "Active Positions",
      value: "7",
      change: 2,
      changePercent: null,
      icon: Target,
    },
    {
      title: "AI Confidence",
      value: "87%",
      change: 5,
      changePercent: null,
      icon: Activity,
    },
  ];

  return (
    <div className="flex-1 space-y-6 p-6 overflow-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trading Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered trading insights and portfolio performance
          </p>
        </div>
        <Badge variant="outline" className="profit border-current">
          <Activity className="h-3 w-3 mr-1" />
          Live Data
        </Badge>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="trading-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.changePercent !== null && (
                <p className={`text-xs ${stat.change >= 0 ? 'profit' : 'loss'}`}>
                  {stat.change >= 0 ? '+' : ''}{stat.changePercent}% from yesterday
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <MarketOverview />
          <PortfolioSummary />
        </div>
        
        <div className="space-y-6">
          <TradingSignals />
          <WatchList />
          <RecentTrades />
        </div>
      </div>

      {/* Risk Alert */}
      <Card className="trading-card border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Risk Management Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Portfolio concentration in tech sector is 67%. Consider diversification to reduce risk.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
