-- Add 'elite' as a new enum value 
ALTER TYPE subscription_tier ADD VALUE 'elite';

-- Update any existing data from 'enterprise' to 'elite'
UPDATE public.tenants 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';

UPDATE public.subscribers 
SET subscription_tier = 'elite' 
WHERE subscription_tier = 'enterprise';

-- Remove the old 'enterprise' value (this will fail if any data still uses it)
-- Note: PostgreSQL doesn't support removing enum values directly, so we'd need to recreate the type
-- For now, we'll keep both values for backward compatibility