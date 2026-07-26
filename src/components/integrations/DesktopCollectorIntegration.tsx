import { useState } from "react";
import { Copy, Download, Monitor } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DataSurface } from "@/components/workspace/DataSurface";
import { useTenant } from "@/contexts/TenantContext";
import { useToast } from "@/hooks/use-toast";
import { useCaptureProfile } from "@/hooks/useCaptureProfile";
import { supabase } from "@/integrations/supabase/client";

export function DesktopCollectorIntegration() {
  const { tenant } = useTenant();
  const { toast } = useToast();
  const { profile } = useCaptureProfile();
  const [code, setCode] = useState<string>();
  const [expires, setExpires] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function createPairing() {
    if (!tenant) return;
    if (profile !== "desktop_manual") {
      toast({
        title: "Desktop capture is inactive",
        description: "Change the workspace capture profile before pairing a collector.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("collector-pairing", {
      body: { action: "create", tenant_id: tenant.id },
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Could not create pairing code",
        description: error.message,
        variant: "destructive",
      });
      return;
    }
    setCode(data.pairing_code);
    setExpires(data.expires_at);
  }

  return (
    <DataSurface>
      <div className="flex gap-3 border-b border-[var(--workspace-rule)] p-5">
        <Monitor className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
        <div>
          <h2 className="font-semibold">Windows capture host</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">
            Pair one reliable team PC. The collector uses the local League Client API and attaches
            post-game evidence to the selected block.
          </p>
        </div>
      </div>
      <div className="space-y-5 p-5">
        {profile !== "desktop_manual" && (
          <p className="border border-amber-400/25 bg-amber-400/[0.06] px-4 py-3 text-sm leading-6 text-amber-100">
            GRID + Manual is active. Existing collector evidence remains visible, but new pairings and captures are disabled.
          </p>
        )}
        <ol className="ml-5 list-decimal space-y-2 text-sm leading-6 text-[var(--workspace-muted)]">
          <li>Install the Windows collector on the capture host.</li>
          <li>Create a one-time pairing code and enter it within ten minutes.</li>
          <li>Select the scheduled block and leave the collector running through post-game.</li>
        </ol>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void createPairing()} disabled={loading || profile !== "desktop_manual"}>
            {loading ? "Creating…" : "Create pairing code"}
          </Button>
          <Button variant="outline" asChild>
            <a href="/downloads/ScrimStats-Collector-Setup.exe">
              <Download className="h-4 w-4" /> Download Windows beta
            </a>
          </Button>
        </div>
        {code && (
          <div className="border border-[var(--workspace-accent)] bg-[color:rgba(17,226,208,.05)] p-4">
            <div className="flex items-center justify-between gap-3">
              <code className="min-w-0 break-all text-sm">{code}</code>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => void navigator.clipboard.writeText(code)}
                aria-label="Copy pairing code"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-xs text-[var(--workspace-muted)]">
              Expires {expires ? new Date(expires).toLocaleTimeString() : "soon"}. The code can pair
              one device only.
            </p>
          </div>
        )}
      </div>
    </DataSurface>
  );
}
