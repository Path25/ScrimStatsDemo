export type NativeCollectorStatus = {
  state: "unpaired" | "ready" | "capturing" | "finalizing" | "retrying" | "error";
  message: string;
  queueDepth: number;
  recordingArmed: boolean;
  lastCaptureAt?: string;
  selectedScrim?: {
    id: string;
    opponent_name: string;
    scheduled_time: string;
    status: string;
    format?: string | null;
  };
  scrims?: Array<{
    id: string;
    opponent_name: string;
    scheduled_time: string;
    status: string;
    format?: string | null;
  }>;
};

export interface ScrimStatsCollectorBridge {
  getCapabilities(): Promise<{
    bridgeVersion: 3;
    capture: true;
    secureStorage: boolean;
    platform: string;
  }>;
  getStatus(): Promise<NativeCollectorStatus>;
  pair(code: string, label: string): Promise<{
    scrims: NonNullable<NativeCollectorStatus["scrims"]>;
  }>;
  refreshConfiguration(): Promise<{
    scrims: NonNullable<NativeCollectorStatus["scrims"]>;
  }>;
  selectScrim(scrimId: string): Promise<void>;
  setRecordingEnabled(enabled: boolean): Promise<void>;
  exportDiagnostics(): Promise<void>;
  onStatus(callback: (status: NativeCollectorStatus) => void): () => void;
}

declare global {
  interface Window {
    scrimstatsCollector?: ScrimStatsCollectorBridge;
  }
}
