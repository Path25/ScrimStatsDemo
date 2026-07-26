-- Invited-team desktop collector beta. These tables are intentionally not
-- exposed through the Data API: the browser uses authenticated Edge Functions
-- and collectors authenticate with a device credential only.
CREATE TABLE public.collector_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (char_length(label) BETWEEN 1 AND 100),
  credential_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  app_version TEXT,
  last_seen_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.collector_pairing_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL,
  redeemed_at TIMESTAMPTZ,
  redeemed_by_device_id UUID REFERENCES public.collector_devices(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expires_at > created_at)
);

CREATE TABLE public.collector_capture_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_id UUID NOT NULL REFERENCES public.collector_devices(id) ON DELETE RESTRICT,
  scrim_id UUID NOT NULL REFERENCES public.scrims(id) ON DELETE CASCADE,
  client_session_id TEXT NOT NULL,
  local_game_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL DEFAULT 1 CHECK (schema_version > 0),
  status TEXT NOT NULL DEFAULT 'capturing' CHECK (status IN ('capturing', 'completed', 'failed')),
  last_sequence INTEGER NOT NULL DEFAULT 0,
  game_id UUID REFERENCES public.scrim_games(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, client_session_id)
);

CREATE TABLE public.collector_capture_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capture_session_id UUID NOT NULL REFERENCES public.collector_capture_sessions(id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  event_id TEXT NOT NULL,
  occurred_at TIMESTAMPTZ,
  event_type TEXT,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (capture_session_id, event_id),
  UNIQUE (capture_session_id, sequence)
);

CREATE INDEX collector_devices_tenant_status_idx ON public.collector_devices (tenant_id, status);
CREATE INDEX collector_pairing_codes_lookup_idx ON public.collector_pairing_codes (code_hash, expires_at) WHERE redeemed_at IS NULL AND revoked_at IS NULL;
CREATE INDEX collector_capture_sessions_scrim_idx ON public.collector_capture_sessions (scrim_id, status, last_seen_at DESC);

ALTER TABLE public.collector_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_pairing_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_capture_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collector_capture_events ENABLE ROW LEVEL SECURITY;

-- No browser table access: all reads/writes pass through audited functions.
REVOKE ALL ON public.collector_devices, public.collector_pairing_codes, public.collector_capture_sessions, public.collector_capture_events FROM anon, authenticated;

DROP TRIGGER IF EXISTS update_collector_devices_updated_at ON public.collector_devices;
CREATE TRIGGER update_collector_devices_updated_at BEFORE UPDATE ON public.collector_devices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
DROP TRIGGER IF EXISTS update_collector_capture_sessions_updated_at ON public.collector_capture_sessions;
CREATE TRIGGER update_collector_capture_sessions_updated_at BEFORE UPDATE ON public.collector_capture_sessions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

COMMENT ON TABLE public.collector_capture_events IS 'Short-lived diagnostic event buffer. A scheduled retention job should delete events older than 14 days.';
