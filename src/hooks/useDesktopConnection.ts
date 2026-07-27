import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';

export interface CollectorDevice { id: string; label: string; status: 'active' | 'revoked'; app_version: string | null; last_seen_at: string | null; }
export interface CaptureSession { id: string; status: 'capturing' | 'completed' | 'failed'; last_seen_at: string; game_id: string | null; }
export interface DesktopConnectionInfo { isConnected: boolean; sessionId: string | null; lastHeartbeat: Date | null; version: string | null; gameId: string | null; status: 'idle' | 'monitoring' | 'error'; device?: CollectorDevice; source: 'Game Capture' | 'Manual' | 'Unavailable'; }

export function useDesktopConnection(scrimId?: string) {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const query = useQuery({
    queryKey: ['collector-status', tenant?.id, scrimId],
    enabled: Boolean(user && tenant?.id),
    refetchInterval: scrimId ? 15_000 : 60_000,
    refetchIntervalInBackground: false,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('collector-status', { body: { tenant_id: tenant!.id, scrim_id: scrimId } });
      if (error) throw error; return data as { devices: CollectorDevice[]; sessions: CaptureSession[] };
    },
  });
  const device = query.data?.devices?.find((item) => item.status === 'active');
  const session = query.data?.sessions?.find((item) => item.status === 'capturing');
  const lastHeartbeat = device?.last_seen_at ? new Date(device.last_seen_at) : null;
  const isConnected = Boolean(lastHeartbeat && Date.now() - lastHeartbeat.getTime() < 60_000);
  return { connectionInfo: { isConnected, sessionId: session?.id ?? null, lastHeartbeat, version: device?.app_version ?? null, gameId: session?.game_id ?? null, status: session && isConnected ? 'monitoring' : 'idle', device, source: device ? 'Game Capture' : 'Unavailable' } satisfies DesktopConnectionInfo, isLoading: query.isLoading, error: query.error };
}
