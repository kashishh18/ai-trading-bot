-- Fix function search path security warnings
ALTER FUNCTION public.update_portfolio_summary() SET search_path FROM CURRENT;
ALTER FUNCTION public.update_updated_at_column() SET search_path FROM CURRENT;
