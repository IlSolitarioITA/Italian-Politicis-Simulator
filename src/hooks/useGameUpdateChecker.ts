import { useCallback, useEffect, useState } from 'react';
import { APP_VERSION, GITHUB_RELEASES_LATEST_URL } from '../config/appConfig';

interface GitHubReleaseAsset {
  name?: string;
  browser_download_url?: string;
  size?: number;
}

interface GitHubReleaseResponse {
  tag_name?: string;
  name?: string;
  body?: string;
  html_url?: string;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GitHubReleaseAsset[];
}

export interface GameUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  normalizedVersion: string;
  releaseName: string;
  changelog: string;
  apkDownloadUrl: string;
  apkFileName: string | null;
  apkSizeMb: string | null;
  hasApkAsset: boolean;
  releaseUrl: string;
  publishedAt: string | null;
}

/** Normalizza un tag come "v1.2.3-rc1" -> [1, 2, 3] */
function parseSemver(versionTag: string): [number, number, number] {
  const cleaned = versionTag.trim().replace(/^v/i, '').split('-')[0];
  const parts = cleaned.split('.').map((part) => {
    const n = parseInt(part.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(n) ? n : 0;
  });
  return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
}

/** Ritorna > 0 se remote è più recente di local */
export function compareSemver(remoteTag: string, localVersion: string): number {
  const [rMaj, rMin, rPat] = parseSemver(remoteTag);
  const [lMaj, lMin, lPat] = parseSemver(localVersion);
  if (rMaj !== lMaj) return rMaj - lMaj;
  if (rMin !== lMin) return rMin - lMin;
  return rPat - lPat;
}

/** Valida che l'URL di download appartenga a un host HTTPS sicuro di GitHub */
function isSafeGithubUrl(rawUrl: string | undefined): rawUrl is string {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    return (
      host === 'github.com' ||
      host.endsWith('.github.com') ||
      host.endsWith('.githubusercontent.com')
    );
  } catch {
    return false;
  }
}

/** Estrae un changelog testuale leggibile e sicuro (solo testo puro, nessun HTML) */
function formatShortChangelog(rawBody: string | undefined): string {
  if (!rawBody || typeof rawBody !== 'string') {
    return 'Miglioramenti generali, bilanciamento simulazione e correzioni di stabilità.';
  }
  const cleaned = rawBody
    .replace(/\r\n/g, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/\*\*/g, '')
    .trim();

  if (!cleaned) {
    return 'Miglioramenti generali, bilanciamento simulazione e correzioni di stabilità.';
  }
  return cleaned.length > 360 ? `${cleaned.slice(0, 357).trimEnd()}...` : cleaned;
}

async function fetchLatestReleaseJson(signal: AbortSignal): Promise<GitHubReleaseResponse | null> {
  // 1. Supporto bridge nativo Android APK se presente
  if (typeof window !== 'undefined' && typeof window.AndroidNative?.httpRequest === 'function') {
    try {
      const rawResponse = await window.AndroidNative.httpRequest(
        GITHUB_RELEASES_LATEST_URL,
        JSON.stringify({
          method: 'GET',
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': `PalazzoChigiWarRoom/${APP_VERSION}`,
          },
        })
      );
      if (typeof rawResponse === 'string' && rawResponse.trim()) {
        return JSON.parse(rawResponse) as GitHubReleaseResponse;
      }
    } catch {
      // Fallback silenzioso a fetch standard
    }
  }

  // 2. Fetch standard browser / WebView
  const response = await fetch(GITHUB_RELEASES_LATEST_URL, {
    method: 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
    },
    signal,
  });

  if (!response.ok) {
    return null;
  }
  return (await response.json()) as GitHubReleaseResponse;
}

export function useGameUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<GameUpdateInfo | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  useEffect(() => {
    // Se offline fallisce silenziosamente senza bloccare il gioco
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);
    let cancelled = false;

    const runCheck = async () => {
      setIsChecking(true);
      try {
        const release = await fetchLatestReleaseJson(controller.signal);
        if (cancelled || !release || release.draft || !release.tag_name) return;

        const localVersion =
          typeof window !== 'undefined' &&
          typeof window.AndroidNative?.getAppVersion === 'function'
            ? window.AndroidNative.getAppVersion().trim() || APP_VERSION
            : APP_VERSION;

        if (compareSemver(release.tag_name, localVersion) <= 0) {
          return;
        }

        const assets = Array.isArray(release.assets) ? release.assets : [];
        const apkAsset = assets.find(
          (a) =>
            typeof a.name === 'string' &&
            a.name.toLowerCase().endsWith('.apk') &&
            isSafeGithubUrl(a.browser_download_url)
        );

        const safeReleaseUrl = isSafeGithubUrl(release.html_url)
          ? release.html_url
          : `https://github.com`;

        const apkDownloadUrl =
          apkAsset && isSafeGithubUrl(apkAsset.browser_download_url)
            ? apkAsset.browser_download_url
            : safeReleaseUrl;

        const normalized = release.tag_name.trim().replace(/^v/i, '');
        const latestVersion = `v${normalized}`;
        const normalizedLocal = localVersion.replace(/^v/i, '');

        if (!cancelled) {
          setUpdateInfo({
            currentVersion: `v${normalizedLocal}`,
            latestVersion,
            normalizedVersion: normalized,
            releaseName: release.name?.trim() || `Aggiornamento ${latestVersion}`,
            changelog: formatShortChangelog(release.body),
            apkDownloadUrl,
            apkFileName: apkAsset?.name ?? null,
            apkSizeMb:
              typeof apkAsset?.size === 'number' && apkAsset.size > 0
                ? `${(apkAsset.size / (1024 * 1024)).toFixed(1)} MB`
                : null,
            hasApkAsset: Boolean(apkAsset),
            releaseUrl: safeReleaseUrl,
            publishedAt: release.published_at ?? null,
          });
        }
      } catch {
        // Silenzioso: offline, rate-limit GitHub o repo senza release pubblicate
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled) {
          setIsChecking(false);
        }
      }
    };

    void runCheck();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  const triggerDownload = useCallback(async () => {
    if (!updateInfo || !isSafeGithubUrl(updateInfo.apkDownloadUrl)) return;

    // Non tocca né resetta mai palazzo_chigi_saves_v1
    setIsDownloading(true);
    setDownloadFeedback(null);

    try {
      if (
        typeof window !== 'undefined' &&
        typeof window.AndroidNative?.downloadAndInstallApk === 'function'
      ) {
        const apkFileName = updateInfo.apkFileName ?? 'Italian-Politics-Simulator.apk';
        await window.AndroidNative.downloadAndInstallApk(
          updateInfo.apkDownloadUrl,
          apkFileName
        );
        setDownloadFeedback(
          `Download APK avviato (${apkFileName}) nella cartella Download. I tuoi salvataggi locali resteranno intatti.`
        );
      } else {
        const a = document.createElement('a');
        a.href = updateInfo.apkDownloadUrl;
        if (updateInfo.apkFileName) {
          a.download = updateInfo.apkFileName;
        }
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setDownloadFeedback(
          updateInfo.hasApkAsset
            ? `Download avviato (${updateInfo.apkFileName}). Al termine installa l’APK: i salvataggi non verranno cancellati.`
            : 'Apertura pagina GitHub Release per il download dell’aggiornamento.'
        );
      }
    } catch {
      setDownloadFeedback(
        'Impossibile avviare il download automatico in questo momento. Riprova più tardi.'
      );
    } finally {
      setIsDownloading(false);
    }
  }, [updateInfo]);

  const dismissUpdate = useCallback(() => {
    setDismissed(true);
  }, []);

  return {
    updateInfo,
    isChecking,
    dismissed,
    dismissUpdate,
    triggerDownload,
    isDownloading,
    downloadFeedback,
  };
}
