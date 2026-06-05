import { create } from 'zustand';

export const useAudioStore = create((set) => ({
  currentJob: null,
  uploadProgress: 0,
  isUploading: false,
  isAnalyzing: false,
  history: [],
  historyPage: 1,
  historyTotal: 0,
  analysisResult: null,

  setCurrentJob: (job) => set({ currentJob: job }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setIsUploading: (val) => set({ isUploading: val }),
  setIsAnalyzing: (val) => set({ isAnalyzing: val }),
  setHistory: (history, total) => set({ history, historyTotal: total }),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  resetUpload: () => set({ currentJob: null, uploadProgress: 0, isUploading: false, isAnalyzing: false, analysisResult: null }),
}));
