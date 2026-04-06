export {};

declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      toggleFullscreen?: () => void;
      minimizeWindow?: () => void;
      closeWindow?: () => void;
    };
  }
}
