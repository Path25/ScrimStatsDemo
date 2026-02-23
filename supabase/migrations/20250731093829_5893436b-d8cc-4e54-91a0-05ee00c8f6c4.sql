-- First, update any existing data from 'enterprise' to 'elite'
UPDATE public.tenants 
SET subscription_tier = 'elite'::text::subscription_tier 
WHERE subscription_tier::text = 'enterprise';

UPDATE public.subscribers 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';

-- Then update the enum type to rename 'enterprise' to 'elite'
ALTER TYPE subscription_tier RENAME VALUE 'enterprise' TO 'elite';