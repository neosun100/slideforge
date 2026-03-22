import { create } from 'zustand';

interface OCRState {
  engineId: string;
  engineReady: boolean;
  engineLoadProgress: string | null;
  lamaReady: boolean;
  lamaLoadProgress: string | null;
  isProcessing: boolean;
  progressMessage: string;
  progressPercent: number;

  setEngineId: (id: string) => void;
  setEngineReady: (ready: boolean) => void;
  setEngineLoadProgress: (msg: string | null) => void;
  setLamaReady: (ready: boolean) => void;
  setLamaLoadProgress: (msg: string | null) => void;
  setProcessing: (processing: boolean, message?: string) => void;
  setProgress: (percent: number, message?: string) => void;
}

export const useOCRStore = create<OCRState>((set) => ({
  engineId: 'paddle-ocr',
  engineReady: false,
  engineLoadProgress: null,
  lamaReady: false,
  lamaLoadProgress: null,
  isProcessing: false,
  progressMessage: '',
  progressPercent: 0,

  setEngineId: (id) => set({ engineId: id, engineReady: false }),
  setEngineReady: (ready) => set({ engineReady: ready }),
  setEngineLoadProgress: (msg) => set({ engineLoadProgress: msg }),
  setLamaReady: (ready) => set({ lamaReady: ready }),
  setLamaLoadProgress: (msg) => set({ lamaLoadProgress: msg }),
  setProcessing: (processing, message) => set({
    isProcessing: processing,
    progressMessage: message ?? '',
    progressPercent: 0,
  }),
  setProgress: (percent, message) => set((s) => ({
    progressPercent: Math.max(s.progressPercent, percent),
    ...(message ? { progressMessage: message } : {}),
  })),
}));
