import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import TradingPanel from './components/TradingPanel';
import Portfolio from './components/Portfolio';
import Predictions from './components/Predictions';
import Settings from './components/Settings';
import { 
  TrendingUp, 
  Bot, 
  Briefcase, 
  Crystal, 
  Settings as SettingsIcon,
  Activity,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import './App.css';

// Types for our data
interface EngineStatus {
  is_running: boolean;
  auto_trade: boolean;
  market_open: boolean;
  portfolio_summary: {
    total_value: number;
    total_return_percent: number;
    number_of_positions: number;
  };
  trading_stats: {
    total_signals: number;
    success_rate: number;
  };
}

interface Alert {
  id: number;
  type: string;
  message: string;
  symbol?: string;
  timestamp: string;
}

function App() {
  // State management
  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Check backend connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('/health');
        if (response.ok) {
          setIsConnected(true);
          fetchEngineStatus();
        }
      } catch (error) {
        console.error('Backend connection failed:', error);
        setIsConnected(false);
      }
    };

    checkConnection();
    
    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch engine status
  const fetchEngineStatus = async () => {
    try {
      const response = await fetch('/api/engine/status');
      if (response.ok) {
        const data = await response.json();
        setEngineStatus(data);
        
        // Get recent alerts
        if (data.recent_alerts) {
          setAlerts(data.recent_alerts);
        }
      }
    } catch (error) {
      console.error('Failed to fetch engine status:', error);
    }
  };

  // Refresh data every 10 seconds
  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(fetchEngineStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [isConnected]);

  // Toggle auto-trading
  const toggleAutoTrading = async () => {
    try {
      const newState = !engineStatus?.auto_trade;
      const response = await fetch('/api/engine/toggle-auto-trade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ auto_trade: newState }),
      });

      if (response.ok) {
        await fetchEngineStatus();
      }
    } catch (error) {
      console.error('Failed to toggle auto-trading:', error);
    }
  };

  // Start/Stop engine
  const toggleEngine = async () => {
    try {
      const endpoint = engineStatus?.is_running ? '/api/engine/stop' : '/api/engine/start';
      const response = await fetch(endpoint, { method: 'POST' });

      if (response.ok) {
        await fetchEngineStatus();
      }
    } catch (error) {
      console.error('Failed to toggle engine:', error);
    }
  };

  return (
    <div className=\"min-h-screen bg-gray-900 text-white\">
      {/* Header */}
      <header className=\"bg-gray-800 border-b border-gray-700 px-6 py-4\">
        <div className=\"flex items-center justify-between\">
          {/* Logo and Title */}
          <div className=\"flex items-center space-x-3\">
            <div className=\"bg-blue-600 p-2 rounded-lg\">
              <Bot className=\"w-8 h-8\" />
            </div>
            <div>
              <h1 className=\"text-xl font-bold\">AI Trading Bot</h1>
              <p className=\"text-gray-400 text-sm\">Your Smart Money Manager 🤖💰</p>
            </div>
          </div>

          {/* Status Indicators */}
          <div className=\"flex items-center space-x-4\">
            {/* Connection Status */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${\n              isConnected ? 'bg-green-600' : 'bg-red-600'\n            }`}>
              <div className={`w-2 h-2 rounded-full ${\n                isConnected ? 'bg-green-300' : 'bg-red-300'\n              }`} />
              <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
            </div>

            {/* Market Status */}
            {engineStatus && (
              <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${\n                engineStatus.market_open ? 'bg-green-600' : 'bg-yellow-600'\n              }`}>
                <Activity className=\"w-4 h-4\" />
                <span>{engineStatus.market_open ? 'Market Open' : 'Market Closed'}</span>
              </div>
            )}

            {/* Portfolio Value */}
            {engineStatus?.portfolio_summary && (
              <div className=\"flex items-center space-x-2 text-lg font-bold\">
                <DollarSign className=\"w-5 h-5 text-green-400\" />
                <span className=\"text-green-400\">
                  ${engineStatus.portfolio_summary.total_value.toLocaleString()}
                </span>
                <span className={`text-sm ${\n                  engineStatus.portfolio_summary.total_return_percent >= 0 \n                    ? 'text-green-400' : 'text-red-400'\n                }`}>
                  ({engineStatus.portfolio_summary.total_return_percent >= 0 ? '+' : ''}\n                  {engineStatus.portfolio_summary.total_return_percent.toFixed(2)}%)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className=\"mt-4 flex space-x-6\">
          <button\n            onClick={() => setCurrentPage('dashboard')}\n            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${\n              currentPage === 'dashboard' \n                ? 'bg-blue-600 text-white' \n                : 'text-gray-300 hover:text-white hover:bg-gray-700'\n            }`}\n          >\n            <TrendingUp className=\"w-4 h-4\" />\n            <span>Dashboard</span>\n          </button>\n\n          <button\n            onClick={() => setCurrentPage('trading')}\n            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${\n              currentPage === 'trading' \n                ? 'bg-blue-600 text-white' \n                : 'text-gray-300 hover:text-white hover:bg-gray-700'\n            }`}\n          >\n            <Bot className=\"w-4 h-4\" />\n            <span>Trading</span>\n          </button>\n\n          <button\n            onClick={() => setCurrentPage('portfolio')}\n            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${\n              currentPage === 'portfolio' \n                ? 'bg-blue-600 text-white' \n                : 'text-gray-300 hover:text-white hover:bg-gray-700'\n            }`}\n          >\n            <Briefcase className=\"w-4 h-4\" />\n            <span>Portfolio</span>\n          </button>\n\n          <button\n            onClick={() => setCurrentPage('predictions')}\n            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${\n              currentPage === 'predictions' \n                ? 'bg-blue-600 text-white' \n                : 'text-gray-300 hover:text-white hover:bg-gray-700'\n            }`}\n          >\n            <Crystal className=\"w-4 h-4\" />\n            <span>AI Predictions</span>\n          </button>\n\n          <button\n            onClick={() => setCurrentPage('settings')}\n            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${\n              currentPage === 'settings' \n                ? 'bg-blue-600 text-white' \n                : 'text-gray-300 hover:text-white hover:bg-gray-700'\n            }`}\n          >\n            <SettingsIcon className=\"w-4 h-4\" />\n            <span>Settings</span>\n          </button>\n        </nav>\n      </header>\n\n      {/* Control Panel */}\n      {engineStatus && (\n        <div className=\"bg-gray-800 border-b border-gray-700 px-6 py-3\">\n          <div className=\"flex items-center justify-between\">\n            <div className=\"flex items-center space-x-6\">\n              {/* Engine Status */}\n              <div className=\"flex items-center space-x-3\">\n                <span className=\"text-gray-400\">Engine:</span>\n                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${\n                  engineStatus.is_running ? 'bg-green-600' : 'bg-gray-600'\n                }`}>\n                  <div className={`w-2 h-2 rounded-full ${\n                    engineStatus.is_running ? 'bg-green-300' : 'bg-gray-300'\n                  }`} />\n                  <span>{engineStatus.is_running ? 'Running' : 'Stopped'}</span>\n                </div>\n              </div>\n\n              {/* Auto-Trading Status */}\n              <div className=\"flex items-center space-x-3\">\n                <span className=\"text-gray-400\">Auto-Trade:</span>\n                <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-sm ${\n                  engineStatus.auto_trade ? 'bg-blue-600' : 'bg-gray-600'\n                }`}>\n                  <Bot className=\"w-3 h-3\" />\n                  <span>{engineStatus.auto_trade ? 'ON' : 'OFF'}</span>\n                </div>\n              </div>\n\n              {/* Quick Stats */}\n              <div className=\"flex items-center space-x-6 text-sm text-gray-400\">\n                <span>Positions: {engineStatus.portfolio_summary.number_of_positions}</span>\n                <span>Signals: {engineStatus.trading_stats.total_signals}</span>\n                <span>Success: {engineStatus.trading_stats.success_rate}%</span>\n              </div>\n            </div>\n\n            {/* Control Buttons */}\n            <div className=\"flex items-center space-x-3\">\n              <button\n                onClick={toggleAutoTrading}\n                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${\n                  engineStatus.auto_trade\n                    ? 'bg-blue-600 hover:bg-blue-700 text-white'\n                    : 'bg-gray-600 hover:bg-gray-500 text-white'\n                }`}\n              >\n                {engineStatus.auto_trade ? 'Disable Auto-Trade' : 'Enable Auto-Trade'}\n              </button>\n\n              <button\n                onClick={toggleEngine}\n                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${\n                  engineStatus.is_running\n                    ? 'bg-red-600 hover:bg-red-700 text-white'\n                    : 'bg-green-600 hover:bg-green-700 text-white'\n                }`}\n              >\n                {engineStatus.is_running ? 'Stop Engine' : 'Start Engine'}\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n\n      {/* Recent Alerts Bar */}\n      {alerts.length > 0 && (\n        <div className=\"bg-yellow-600 text-black px-6 py-2 text-sm\">\n          <div className=\"flex items-center space-x-2\">\n            <AlertCircle className=\"w-4 h-4\" />\n            <span className=\"font-medium\">Latest:</span>\n            <span>{alerts[alerts.length - 1]?.message}</span>\n            <span className=\"text-yellow-800\">\n              ({new Date(alerts[alerts.length - 1]?.timestamp).toLocaleTimeString()})\n            </span>\n          </div>\n        </div>\n      )}\n\n      {/* Main Content */}\n      <main className=\"p-6\">\n        {!isConnected && (\n          <div className=\"bg-red-600 text-white p-4 rounded-lg mb-6\">\n            <div className=\"flex items-center space-x-2\">\n              <AlertCircle className=\"w-5 h-5\" />\n              <span className=\"font-medium\">Backend Disconnected</span>\n            </div>\n            <p className=\"mt-2 text-sm\">\n              Cannot connect to the trading bot backend. Make sure the Python server is running on port 8000.\n            </p>\n            <p className=\"mt-1 text-sm text-red-200\">\n              Run: <code className=\"bg-red-700 px-2 py-1 rounded\">cd backend && python main.py</code>\n            </p>\n          </div>\n        )}\n\n        {/* Page Content */}\n        {currentPage === 'dashboard' && <Dashboard />}\n        {currentPage === 'trading' && <TradingPanel />}\n        {currentPage === 'portfolio' && <Portfolio />}\n        {currentPage === 'predictions' && <Predictions />}\n        {currentPage === 'settings' && <Settings />}\n      </main>\n    </div>\n  );\n}\n\nexport default App;"
