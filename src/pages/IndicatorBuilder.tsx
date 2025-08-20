import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Save, 
  Play, 
  Download, 
  Upload,
  Plus,
  Minus,
  X,
  Trash2,
  Copy,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from "sonner";
import MarketStatusBar from "@/components/market/MarketStatusBar";

// Types for the formula builder
type FormulaNode = {
  id: string;
  type: 'operation' | 'data' | 'constant' | 'function';
  value: string;
  children?: FormulaNode[];
  position: { x: number; y: number };
};

type SavedIndicator = {
  id: string;
  name: string;
  description: string;
  formula_config: any;
  created_at: string;
  updated_at: string;
  is_public: boolean;
  user_id: string;
};

// Available operations and functions
const OPERATIONS = [
  { id: 'add', symbol: '+', label: 'Add', type: 'binary' },
  { id: 'subtract', symbol: '-', label: 'Subtract', type: 'binary' },
  { id: 'multiply', symbol: '*', label: 'Multiply', type: 'binary' },
  { id: 'divide', symbol: '/', label: 'Divide', type: 'binary' },
  { id: 'power', symbol: '^', label: 'Power', type: 'binary' },
];

const FUNCTIONS = [
  { id: 'sma', label: 'Simple Moving Average', params: ['period'] },
  { id: 'ema', label: 'Exponential Moving Average', params: ['period'] },
  { id: 'rsi', label: 'Relative Strength Index', params: ['period'] },
  { id: 'macd', label: 'MACD', params: ['fast', 'slow', 'signal'] },
  { id: 'bollinger', label: 'Bollinger Bands', params: ['period', 'deviation'] },
  { id: 'stochastic', label: 'Stochastic', params: ['k_period', 'd_period'] },
  { id: 'atr', label: 'Average True Range', params: ['period'] },
  { id: 'adx', label: 'Average Directional Index', params: ['period'] },
  { id: 'max', label: 'Maximum', params: ['period'] },
  { id: 'min', label: 'Minimum', params: ['period'] },
  { id: 'abs', label: 'Absolute Value', params: [] },
  { id: 'sqrt', label: 'Square Root', params: [] },
];

const DATA_SOURCES = [
  { id: 'close', label: 'Close Price' },
  { id: 'open', label: 'Open Price' },
  { id: 'high', label: 'High Price' },
  { id: 'low', label: 'Low Price' },
  { id: 'volume', label: 'Volume' },
];

export default function IndicatorBuilder() {
  const [formula, setFormula] = useState<FormulaNode[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [indicatorName, setIndicatorName] = useState('');
  const [description, setDescription] = useState('');
  const [savedIndicators, setSavedIndicators] = useState<SavedIndicator[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggedItem, setDraggedItem] = useState<any>(null);

  // Load saved indicators
  useEffect(() => {
    loadSavedIndicators();
  }, []);

  const loadSavedIndicators = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_indicators')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setSavedIndicators(data || []);
    } catch (error) {
      console.error('Error loading indicators:', error);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: any, type: string) => {
    setDraggedItem({ ...item, type });
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedItem || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newNode: FormulaNode = {
      id: `node_${Date.now()}`,
      type: draggedItem.type,
      value: draggedItem.id || draggedItem.symbol || draggedItem.label,
      position: { x, y },
      children: []
    };

    setFormula(prev => [...prev, newNode]);
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const removeNode = (nodeId: string) => {
    setFormula(prev => prev.filter(node => node.id !== nodeId));
  };

  const calculateIndicator = async () => {
    if (formula.length === 0) {
      toast.error('Please add formula components first');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate indicator calculation with sample data
      const sampleData = generateSampleData();
      setChartData(sampleData);
      toast.success('Indicator calculated successfully');
    } catch (error) {
      console.error('Error calculating indicator:', error);
      toast.error('Error calculating indicator');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleData = () => {
    const data = [];
    const basePrice = 150;
    
    for (let i = 0; i < 50; i++) {
      const price = basePrice + Math.sin(i / 5) * 10 + Math.random() * 5;
      const indicatorValue = price + Math.sin(i / 3) * 8; // Simple transformation
      
      data.push({
        date: new Date(Date.now() - (50 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: price.toFixed(2),
        indicator: indicatorValue.toFixed(2)
      });
    }
    
    return data;
  };

  const saveIndicator = async () => {
    if (!indicatorName.trim()) {
      toast.error('Please enter an indicator name');
      return;
    }

    if (formula.length === 0) {
      toast.error('Please create a formula first');
      return;
    }

    try {
      const { error } = await supabase
        .from('custom_indicators')
        .insert({
          name: indicatorName,
          description: description,
          formula_config: formula,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast.success('Indicator saved successfully');
      setShowSaveDialog(false);
      setIndicatorName('');
      setDescription('');
      loadSavedIndicators();
    } catch (error) {
      console.error('Error saving indicator:', error);
      toast.error('Error saving indicator');
    }
  };

  const loadIndicator = (indicator: SavedIndicator) => {
    setFormula(indicator.formula_config);
    setIndicatorName(indicator.name);
    setDescription(indicator.description);
    toast.success(`Loaded indicator: ${indicator.name}`);
  };

  const deleteIndicator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('custom_indicators')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Indicator deleted');
      loadSavedIndicators();
    } catch (error) {
      console.error('Error deleting indicator:', error);
      toast.error('Error deleting indicator');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketStatusBar />
      
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Custom Indicator Builder</h1>
          <p className="text-muted-foreground mt-2">
            Create your own technical indicators with drag-and-drop formula builder
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Components */}
          <div className="lg:col-span-1 space-y-4">
            {/* Data Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Data Sources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {DATA_SOURCES.map(source => (
                  <div
                    key={source.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, source, 'data')}
                    className="p-2 bg-primary/10 rounded-md cursor-move hover:bg-primary/20 transition-colors"
                  >
                    <span className="text-xs font-medium">{source.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Mathematical Operations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {OPERATIONS.map(op => (
                  <div
                    key={op.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, op, 'operation')}
                    className="p-2 bg-secondary/50 rounded-md cursor-move hover:bg-secondary/70 transition-colors text-center"
                  >
                    <span className="text-sm font-medium">{op.symbol} {op.label}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Functions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Functions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <ScrollArea className="h-48">
                  {FUNCTIONS.map(func => (
                    <div
                      key={func.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, func, 'function')}
                      className="p-2 bg-accent/50 rounded-md cursor-move hover:bg-accent/70 transition-colors mb-2"
                    >
                      <div className="text-xs font-medium">{func.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {func.params.length > 0 && `(${func.params.join(', ')})`}
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Center Panel - Formula Builder */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Formula Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  ref={canvasRef}
                  className="min-h-96 border-2 border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/20 relative"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                >
                  {formula.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Drag components here to build your formula
                    </div>
                  ) : (
                    formula.map(node => (
                      <div
                        key={node.id}
                        className="absolute bg-white border rounded-lg p-3 shadow-sm min-w-24 text-center"
                        style={{
                          left: node.position.x,
                          top: node.position.y,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0"
                          onClick={() => removeNode(node.id)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <div className="text-xs font-medium">{node.value}</div>
                        <Badge variant="outline" className="text-xs mt-1">
                          {node.type}
                        </Badge>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Select value={selectedSymbol} onValueChange={setSelectedSymbol}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AAPL">AAPL</SelectItem>
                      <SelectItem value="GOOGL">GOOGL</SelectItem>
                      <SelectItem value="MSFT">MSFT</SelectItem>
                      <SelectItem value="TSLA">TSLA</SelectItem>
                      <SelectItem value="AMZN">AMZN</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={calculateIndicator} disabled={isLoading}>
                    <Play className="w-4 h-4 mr-2" />
                    {isLoading ? 'Calculating...' : 'Test Indicator'}
                  </Button>
                  <Button variant="outline" onClick={() => setFormula([])}>
                    Clear
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Chart Preview */}
            <Card>
              <CardHeader>
                <CardTitle>Preview Chart</CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Price"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="indicator" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        name="Custom Indicator"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    Run a test to see the chart preview
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Saved Indicators */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm">Saved Indicators</CardTitle>
                <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save Custom Indicator</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="My RSI Variant"
                          value={indicatorName}
                          onChange={(e) => setIndicatorName(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe your custom indicator..."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                      <Button onClick={saveIndicator} className="w-full">
                        Save Indicator
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  {savedIndicators.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No saved indicators yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {savedIndicators.map(indicator => (
                        <div
                          key={indicator.id}
                          className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium">{indicator.name}</h4>
                              {indicator.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {indicator.description}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(indicator.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => loadIndicator(indicator)}
                                className="h-8 w-8 p-0"
                              >
                                <Upload className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteIndicator(indicator.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
