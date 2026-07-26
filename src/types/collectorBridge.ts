export type NativeCollectorStatus = {
  state: "unpaired" | "ready" | "capturing" | "retrying" | "error";
  message: string;
  queueDepth: number;
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
    bridgeVersion: 1;
    capture: true;
    secureStorage: boolean;
    platform: string;
  }>;
  getStatus(): Promise<NativeCollectorStatus>;
  pair(code: string, label: string): Promise<{
    scrims: NonNullable<NativeCollectorStatus["scrims"]>;
  }>;
  selectScrim(scrimId: string): Promise<void>;
  exportDiagnostics(): Promise<void>;
  onStatus(callback: (status: NativeCollectorStatus) => void): () => void;
}

declare global {
  interface Window {
    scrimstatsCollector?: ScrimStatsCollectorBridge;
  }
}
