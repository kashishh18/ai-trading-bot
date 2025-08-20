import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export default function MarketStatusBar() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [marketIndices, setMarketIndices] = useState<MarketIndex[]>([]);
  const [isMarketOpen, setIsMarketOpen] = useState(false);

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Fetch market indices data
    fetchMarketIndices();

    // Refresh market data every 5 minutes
    const dataInterval = setInterval(fetchMarketIndices, 5 * 60 * 1000);

    return () => {
      clearInterval(timeInterval);
      clearInterval(dataInterval);
    };
  }, []);

  useEffect(() => {
    checkMarketStatus();
  }, [currentTime]);

  const fetchMarketIndices = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('yahoo-finance-data', {
        body: {
          action: 'current_quotes',
          symbols: ['^GSPC', '^IXIC'] // S&P 500 and NASDAQ
        }
      });

      if (error) throw error;

      const indices = data.quotes?.map((quote: any) => ({
        symbol: quote.symbol,
        name: quote.symbol === '^GSPC' ? 'S&P 500' : 'NASDAQ',
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent
      })) || [];

      setMarketIndices(indices);
    } catch (error) {
      console.error('Error fetching market indices:', error);
    }
  };

  const checkMarketStatus = () => {
    const now = new Date();
    const easternTime = new Date(now.toLocaleString("en-US", {timeZone: "America/New_York"}));
    const dayOfWeek = easternTime.getDay(); // 0 = Sunday, 6 = Saturday
    const hours = easternTime.getHours();
    const minutes = easternTime.getMinutes();
    const currentTimeInMinutes = hours * 60 + minutes;
    
    // Market is open Monday (1) to Friday (5), 9:30 AM to 4:00 PM ET
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
    const marketOpenTime = 9 * 60 + 30; // 9:30 AM in minutes
    const marketCloseTime = 16 * 60; // 4:00 PM in minutes
    
    const isOpenTime = currentTimeInMinutes >= marketOpenTime && currentTimeInMinutes < marketCloseTime;
    
    setIsMarketOpen(isWeekday && isOpenTime);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatChange = (change: number, changePercent: number) => {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${changePercent.toFixed(2)}%)`;
  };

  return (
    <Card className="mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* Market Status & Time */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge 
                variant={isMarketOpen ? "default" : "secondary"}
                className={`${isMarketOpen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'} text-white`}
              >
                {isMarketOpen ? 'Market Open' : 'Market Closed'}
              </Badge>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span className="font-mono">
                  {formatTime(currentTime)} ET
                </span>
              </div>
            </div>
          </div>

          {/* Market Indices */}
          <div className="flex items-center gap-6">
            {marketIndices.map((index) => (
              <div key={index.symbol} className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{index.name}</span>
                    {index.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-lg font-bold font-mono">
                    {formatPrice(index.price)}
                  </div>
                  <div className={`text-xs font-mono ${index.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {formatChange(index.change, index.changePercent)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
