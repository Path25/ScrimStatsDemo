import { Activity, CircleAlert, Monitor, Wifi, WifiOff } from "lucide-react";

import { DataSurface } from "@/components/workspace/DataSurface";
import { SourceBadge } from "@/components/workspace/SourceBadge";
import { useDesktopConnection } from "@/hooks/useDesktopConnection";
import type { ScrimGame } from "@/types/scrimGame";

export function DesktopAppStatus({ game }: { game?: ScrimGame }) {
  const { connectionInfo, isLoading, error } = useDesktopConnection(game?.scrim_id);
  const source = connectionInfo.device ? "collector" : "unavailable";
  const statusLabel = isLoading
    ? "Checking Game Capture"
    : error
      ? "Game Capture status unavailable"
      : connectionInfo.status === "monitoring"
        ? "Saving the current game"
        : connectionInfo.isConnected
          ? "Connected and ready for a game"
          : connectionInfo.device
            ? "Game computer offline; retrying automatically"
            : "No game computer connected";

  return (
    <DataSurface className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Monitor className="h-5 w-5 text-[var(--workspace-accent)]" aria-hidden="true" />
          <div>
            <h2 className="font-semibold">Game Capture connection</h2>
            <p className="mt-1 text-sm text-[var(--workspace-muted)]">Windows game computer status</p>
          </div>
        </div>
        <SourceBadge source={source} compact />
      </div>

      <div className="mt-5 flex items-start gap-3 border-t border-[var(--workspace-rule)] pt-4 text-sm">
        {connectionInfo.isConnected ? (
          <Wifi className="mt-0.5 h-4 w-4 text-emerald-300" aria-hidden="true" />
        ) : (
          <WifiOff className="mt-0.5 h-4 w-4 text-[var(--workspace-awaiting)]" aria-hidden="true" />
        )}
        <span>{statusLabel}</span>
      </div>

      {connectionInfo.status === "monitoring" && (
        <div className="mt-4 flex items-start gap-3 border-l-2 border-emerald-400 bg-emerald-400/[0.045] px-4 py-3 text-sm text-emerald-200">
          <Activity className="mt-0.5 h-4 w-4 animate-pulse" aria-hidden="true" />
          The game will be saved after the League post-game screen appears.
        </div>
      )}

      {!connectionInfo.device && !isLoading && (
        <div className="mt-4 flex items-start gap-3 border-l-2 border-[var(--workspace-manual)] bg-amber-300/[0.035] px-4 py-3 text-sm text-amber-100">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Open Game Capture in the Windows app to connect this computer. Manual result entry remains available.
        </div>
      )}

      {connectionInfo.device && (
        <dl className="mt-5 grid gap-3 border-t border-[var(--workspace-rule)] pt-4 text-xs text-[var(--workspace-subtle)] sm:grid-cols-2">
          <div>
            <dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Computer</dt>
            <dd className="mt-1 text-[var(--workspace-muted)]">{connectionInfo.device.label}</dd>
          </div>
          <div>
            <dt className="workspace-eyebrow text-[var(--workspace-subtle)]">Last seen</dt>
            <dd className="mt-1 text-[var(--workspace-muted)]">
              {connectionInfo.lastHeartbeat?.toLocaleTimeString() ?? "Never"}
            </dd>
          </div>
        </dl>
      )}
    </DataSurface>
  );
}
