import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Predictions from './pages/Predictions';
import IndicatorBuilder from './pages/IndicatorBuilder';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-semibold">TradingAI</h1>
              <div className="flex gap-2">
                <Button variant="ghost" asChild>
                  <a href="/">Predictions</a>
                </Button>
                <Button variant="ghost" asChild>
                  <a href="/indicator-builder">Indicator Builder</a>
                </Button>
              </div>
            </div>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Predictions />} />
          <Route path="/indicator-builder" element={<IndicatorBuilder />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
