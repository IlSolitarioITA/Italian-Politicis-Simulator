/**
 * Configurazione centrale versione app e aggiornamenti GitHub Releases / APK.
 * Modifica APP_VERSION e GITHUB_REPO qui quando pubblichi una nuova release.
 */
export const APP_VERSION = '1.1.0';

export const GITHUB_REPO = 'IlSolitarioITA/Italian-Politicis-Simulator';

export const GITHUB_RELEASES_LATEST_URL = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

export interface AndroidNativeBridge {
  /** Legge il versionName reale dell'APK installato */
  getAppVersion?: () => string;
  /** Richiesta HTTP nativa opzionale esposta dal wrapper APK Android */
  httpRequest?: (url: string, optionsJson?: string) => Promise<string> | string;
  /** Download e installazione nativa APK esposta dal wrapper Android via DownloadManager */
  downloadAndInstallApk?: (apkUrl: string, fileName?: string) => Promise<void> | void;
}

declare global {
  interface Window {
    AndroidNative?: AndroidNativeBridge;
  }
}
