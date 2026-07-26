import { useState } from "react";
import { CheckCircle2, KeyRound, RefreshCw, ShieldAlert, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DataSurface } from "@/components/workspace/DataSurface";
import { WorkspaceState } from "@/components/workspace/WorkspaceState";
import { useRiotIntegration } from "@/hooks/useRiotIntegration";

type RiotKeyKind = "development" | "personal" | "production";

export function RiotApiIntegration({ canManage }: { canManage: boolean }) {
  const riot = useRiotIntegration();
  const [apiKey, setApiKey] = useState("");
  const [keyKind, setKeyKind] = useState<RiotKeyKind>("development");
  const [editing, setEditing] = useState(false);

  if (riot.isLoading) {
    return (
      <WorkspaceState
        icon={KeyRound}
        title="Loading Riot connection…"
        description="Reading workspace-safe credential metadata."
      />
    );
  }
  if (riot.error) {
    return (
      <WorkspaceState
        icon={ShieldAlert}
        title="Riot integration unavailable"
        description="The credential contract could not be loaded. Try again after checking the workspace migration."
      />
    );
  }

  const integration = riot.data;
  return (
    <DataSurface>
      <div className="border-b border-[var(--workspace-rule)] p-5">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 text-[var(--workspace-accent)]" />
          <div className="min-w-0">
            <h3 className="font-semibold">Tenant-managed Riot API</h3>
            <p className="mt-2 text-sm leading-6 text-[var(--workspace-muted)]">
              Used for roster and opponent Solo Queue refreshes. The saved key is encrypted in
              Supabase Vault and is never returned to this browser.
            </p>
          </div>
        </div>
      </div>

      {integration ? (
        <>
        <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`workspace-source-badge ${
                integration.status === "active"
                  ? "workspace-source-collector"
                  : "workspace-source-awaiting"
              }`}>
                {integration.status === "active" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <ShieldAlert className="h-3.5 w-3.5" />
                )}
                {integration.status.replaceAll("_", " ")}
              </span>
              <span className="ss-mono text-xs uppercase text-[var(--workspace-subtle)]">
                {integration.key_kind} · ends {integration.key_hint}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--workspace-muted)]">
              {integration.last_success_at
                ? `Last verified ${new Date(integration.last_success_at).toLocaleString()}`
                : integration.last_error_message || "Awaiting verification"}
            </p>
          </div>
          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => setEditing((value) => !value)}
                disabled={riot.mutating}
              >
                <KeyRound className="h-4 w-4" />
                Replace
              </Button>
              <Button
                variant="outline"
                onClick={() => void riot.test().catch(() => undefined)}
                disabled={riot.mutating}
              >
                <RefreshCw className="h-4 w-4" />
                Test
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm("Remove this workspace's encrypted Riot API credential?")) {
                    void riot.remove()
                      .then(() => setEditing(false))
                      .catch(() => undefined);
                  }
                }}
                disabled={riot.mutating}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          )}
        </div>
        {editing && (
          <CredentialForm
            apiKey={apiKey}
            keyKind={keyKind}
            pending={riot.mutating}
            onApiKeyChange={setApiKey}
            onKeyKindChange={setKeyKind}
            onSubmit={async () => {
              await riot.save(apiKey, keyKind);
              setApiKey("");
              setEditing(false);
            }}
          />
        )}
        </>
      ) : canManage ? (
        <CredentialForm
          apiKey={apiKey}
          keyKind={keyKind}
          pending={riot.mutating}
          onApiKeyChange={setApiKey}
          onKeyKindChange={setKeyKind}
          onSubmit={async () => {
            await riot.save(apiKey, keyKind);
            setApiKey("");
          }}
        />
      ) : (
        <p className="p-5 text-sm leading-6 text-[var(--workspace-muted)]">
          No tenant Riot connection is configured. An owner or admin can connect one.
        </p>
      )}
    </DataSurface>
  );
}

function CredentialForm({
  apiKey,
  keyKind,
  pending,
  onApiKeyChange,
  onKeyKindChange,
  onSubmit,
}: {
  apiKey: string;
  keyKind: RiotKeyKind;
  pending: boolean;
  onApiKeyChange: (value: string) => void;
  onKeyKindChange: (value: RiotKeyKind) => void;
  onSubmit: () => Promise<void>;
}) {
  return (
    <form
      className="grid gap-5 border-t border-[var(--workspace-rule)] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit().catch(() => undefined);
      }}
    >
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <div>
              <Label htmlFor="riot-api-key">Riot API key</Label>
              <Input
                id="riot-api-key"
                type="password"
                value={apiKey}
                onChange={(event) => onApiKeyChange(event.target.value)}
                placeholder="RGAPI-…"
                autoComplete="off"
                minLength={20}
                required
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="riot-key-kind">Key type</Label>
              <select
                id="riot-key-kind"
                value={keyKind}
                onChange={(event) => onKeyKindChange(event.target.value as RiotKeyKind)}
                className="mt-1.5 h-10 w-full border border-[var(--workspace-rule-strong)] bg-[var(--workspace-surface)] px-3 text-sm"
              >
                <option value="development">Development</option>
                <option value="personal">Personal</option>
                <option value="production">Production</option>
              </select>
            </div>
          </div>
          <div className="border-l-2 border-[var(--workspace-awaiting)] pl-4">
            <p className="text-sm font-medium">Private testing only unless Riot approves the product.</p>
            <p className="mt-1 text-sm leading-6 text-[var(--workspace-muted)]">
              Development keys expire every 24 hours. Personal keys cannot operate a public
              alpha or beta. Each organisation remains responsible for its Riot Developer Portal
              account and policy compliance.
            </p>
          </div>
          <div>
            <Button type="submit" disabled={pending || apiKey.trim().length < 20}>
              <KeyRound className="h-4 w-4" />
              {pending ? "Validating…" : "Validate and connect"}
            </Button>
          </div>
    </form>
  );
}
