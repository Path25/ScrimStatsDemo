-- Update any existing data from 'enterprise' to 'elite'
UPDATE public.tenants 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';

UPDATE public.subscribers 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';