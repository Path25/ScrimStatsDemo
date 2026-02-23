-- Phase 1 Core Schema: Tenants, Profiles, User Settings

-- 1. Tenants Table (Organization)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'elite')),
  subscription_status TEXT NOT NULL DEFAULT 'active',
  grid_api_key TEXT,
  grid_team_id TEXT,
  grid_integration_enabled BOOLEAN DEFAULT false,
  settings JSONB DEFAULT '{}', -- stores logo_url, primary_color, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tenant Users Table (Membership & Roles)
CREATE TABLE IF NOT EXISTS public.tenant_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player' CHECK (role IN ('owner', 'manager', 'coach', 'player')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 3. Profiles Table (User Details per Tenant)
-- Note: Linking to tenant allows different profiles (e.g. distinct IGNs) per organization if needed.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  riot_ign TEXT,
  game_role TEXT CHECK (game_role IN ('top', 'jungle', 'mid', 'adc', 'support', 'coach', 'analyst', 'manager')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(tenant_id, user_id)
);

-- 4. User Settings Table (Global Preferences)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark', 'light', 'oled')),
  density TEXT DEFAULT 'comfortable' CHECK (density IN ('comfortable', 'compact')),
  glass_intensity INTEGER DEFAULT 50 CHECK (glass_intensity BETWEEN 0 AND 100),
  notifications JSONB DEFAULT '{"email_scrims": true, "inapp_mentions": true}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Tenants: Visible to members
CREATE POLICY "Members can view their own tenant" ON public.tenants
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_users.tenant_id = tenants.id
    AND tenant_users.user_id = auth.uid()
  )
);

CREATE POLICY "Owners/Managers can update their tenant" ON public.tenants
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users
    WHERE tenant_users.tenant_id = tenants.id
    AND tenant_users.user_id = auth.uid()
    AND tenant_users.role IN ('owner', 'manager')
  )
);

-- Tenant Users: Visible to fellow members
CREATE POLICY "Members can view other members in same tenant" ON public.tenant_users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenant_users.tenant_id
    AND tu.user_id = auth.uid()
  )
);

CREATE POLICY "Owners/Managers can manage members" ON public.tenant_users
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = tenant_users.tenant_id
    AND tu.user_id = auth.uid()
    AND tu.role IN ('owner', 'manager')
  )
);

-- Profiles: Public to tenant members
CREATE POLICY "Members can view profiles in same tenant" ON public.profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.tenant_users tu
    WHERE tu.tenant_id = profiles.tenant_id
    AND tu.user_id = auth.uid()
  )
);

CREATE POLICY "Users can edit their own profile" ON public.profiles
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (user_id = auth.uid());

-- User Settings: Private to user
CREATE POLICY "Users can manage their own settings" ON public.user_settings
FOR ALL USING (user_id = auth.uid());

-- Triggers for Updated At
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_tenants_updated_at ON public.tenants;
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON public.tenant_users;
CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON public.tenant_users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON public.user_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
