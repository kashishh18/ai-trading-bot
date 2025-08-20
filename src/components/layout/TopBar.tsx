import { useState, useEffect } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, User, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/card";

export function TopBar() {
  const [marketStatus, setMarketStatus] = useState<"open" | "closed" | "pre" | "after">("open");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      
      // Simple market hours logic (9:30 AM - 4:00 PM ET)
      const now = new Date();
      const hour = now.getHours();
      const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
      
      if (!isWeekday) {
        setMarketStatus("closed");
      } else if (hour >= 9 && hour < 16) {
        setMarketStatus("open");
      } else if (hour >= 4 && hour < 9) {
        setMarketStatus("pre");
      } else {
        setMarketStatus("after");
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const getMarketStatusColor = () => {
    switch (marketStatus) {
      case "open": return "profit";
      case "closed": return "loss";
      default: return "neutral";
    }
  };

  return (
    <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="hover:bg-accent" />
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`${getMarketStatusColor()} border-current`}>
            {marketStatus === "open" ? <Wifi className="h-3 w-3 mr-1" /> : <WifiOff className="h-3 w-3 mr-1" />}
            Market {marketStatus.toUpperCase()}
          </Badge>
          
          <span className="text-sm text-muted-foreground">
            {currentTime.toLocaleTimeString('en-US', {
              hour12: true,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Card className="px-3 py-1 bg-card/50">
          <div className="flex items-center gap-3 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">S&P 500:</span>
              <span className="profit">+0.85%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">NASDAQ:</span>
              <span className="profit">+1.24%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">DOW:</span>
              <span className="loss">-0.32%</span>
            </div>
          </div>
        </Card>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-destructive">
              3
            </Badge>
          </Button>
          
          <Button variant="ghost" size="sm">
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
