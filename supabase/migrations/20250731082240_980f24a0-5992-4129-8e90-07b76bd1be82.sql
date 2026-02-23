-- Update subscription_tier enum to use 'elite' instead of 'enterprise'
ALTER TYPE subscription_tier RENAME VALUE 'enterprise' TO 'elite';

-- Update any existing tenants with 'enterprise' tier to 'elite'
UPDATE public.tenants 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';

-- Update any existing subscribers with 'enterprise' tier to 'elite'
UPDATE public.subscribers 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';