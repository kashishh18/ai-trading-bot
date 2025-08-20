-- Create custom indicators table
CREATE TABLE public.custom_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  formula_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_public BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.custom_indicators ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own custom indicators" 
ON public.custom_indicators 
FOR SELECT 
USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create their own custom indicators" 
ON public.custom_indicators 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom indicators" 
ON public.custom_indicators 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom indicators" 
ON public.custom_indicators 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_indicators_updated_at
BEFORE UPDATE ON public.custom_indicators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
