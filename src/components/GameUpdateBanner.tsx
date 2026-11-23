import React, { useEffect, useState } from 'react';
import { GameUpdateInfo } from '../hooks/useGameUpdateChecker';
import {
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  Share,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface GameUpdateBannerProps {
  updateInfo: GameUpdateInfo | null;
  dismissed: boolean;
  isDownloading: boolean;
  downloadFeedback: string | null;
  onDownload: () => void;
  onDismiss: () => void;
}

const IOS_INSTALL_HINT_DISMISSED_KEY = 'palazzo_chigi_ios_install_dismissed_v1';
const PWA_INSTALL_HINT_DISMISSED_KEY = 'palazzo_chigi_pwa_install_dismissed_v1';

function detectPlatformFlags() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isAndroidNative: false,
      isStandalone: false,
      isIOSSafari: false,
    };
  }

  const isAndroidNative = Boolean(window.AndroidNative);

  const nav = window.navigator as Navigator & { standalone?: boolean };
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;

  const ua = navigator.userAgent.toLowerCase();
  const isIOSDevice =
    /iphone|ipad|ipod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isSafariEngine =
    /safari/.test(ua) && !/crios|fxios|edgios|opios|chrome|android/.test(ua);

  return {
    isAndroidNative,
    isStandalone,
    isIOSSafari: isIOSDevice && isSafariEngine && !isStandalone && !isAndroidNative,
  };
}

function readOnceFlag(key: string): boolean {
  if (typeof window === 'undefined') return true;
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeOnceFlag(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    // Non tocca mai la chiave dei salvataggi palazzo_chigi_saves_v1
    window.localStorage.setItem(key, '1');
  } catch {
    // Ignora errori in modalità privata ristretta
  }
}

export const GameUpdateBanner: React.FC<GameUpdateBannerProps> = ({
  updateInfo,
  dismissed,
  isDownloading,
  downloadFeedback,
  onDownload,
  onDismiss,
}) => {
  const [showChangelog, setShowChangelog] = useState(false);
  const [isReloadingWebApp, setIsReloadingWebApp] = useState(false);
  const [platform, setPlatform] = useState(() => detectPlatformFlags());
  const [iosHintDismissed, setIosHintDismissed] = useState<boolean>(() =>
    readOnceFlag(IOS_INSTALL_HINT_DISMISSED_KEY)
  );
  const [pwaHintDismissed, setPwaHintDismissed] = useState<boolean>(() =>
    readOnceFlag(PWA_INSTALL_HINT_DISMISSED_KEY)
  );
  const [deferredInstallPrompt, setDeferredInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatformFlags());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredInstallPrompt(null);
      setPlatform((prev) => ({ ...prev, isStandalone: true, isIOSSafari: false }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /** Ricarica la Web App / PWA aggiornata senza mai toccare palazzo_chigi_saves_v1 */
  const handleWebAppReload = async () => {
    setIsReloadingWebApp(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((reg) => reg.update().catch(() => undefined)));
      }
      if ('caches' in window) {
        const cacheKeys = await window.caches.keys();
        await Promise.all(cacheKeys.map((key) => window.caches.delete(key).catch(() => false)));
      }
    } catch {
      // Fallback diretto al reload pagina
    } finally {
      window.location.reload();
    }
  };

  const handleDismissIosHint = () => {
    writeOnceFlag(IOS_INSTALL_HINT_DISMISSED_KEY);
    setIosHintDismissed(true);
  };

  const handleDismissPwaHint = () => {
    writeOnceFlag(PWA_INSTALL_HINT_DISMISSED_KEY);
    setPwaHintDismissed(true);
  };

  const handleInstallPwa = async () => {
    if (!deferredInstallPrompt) return;
    try {
      await deferredInstallPrompt.prompt();
      const { outcome } = await deferredInstallPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredInstallPrompt(null);
        writeOnceFlag(PWA_INSTALL_HINT_DISMISSED_KEY);
        setPwaHintDismissed(true);
      }
    } catch {
      // Ignora annullamento utente
    }
  };

  const showGitHubUpdate = Boolean(updateInfo && !dismissed);
  const showIosInstallBanner =
    !showGitHubUpdate && platform.isIOSSafari && !iosHintDismissed;
  const showChromiumInstallBanner =
    !showGitHubUpdate &&
    !showIosInstallBanner &&
    !platform.isAndroidNative &&
    !platform.isStandalone &&
    Boolean(deferredInstallPrompt) &&
    !pwaHintDismissed;

  // 1. Banner Aggiornamento da GitHub Releases (Android APK vs Web/PWA)
  if (showGitHubUpdate && updateInfo) {
    return (
      <div
        role="region"
        aria-label="Aggiornamento disponibile"
        className="w-full bg-[#111827] border-b border-amber-500/50 px-3 sm:px-5 py-2.5 shrink-0 z-30"
      >
        <div className="max-w-7xl mx-auto space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 sm:mt-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                  <span className="font-display font-bold text-slate-50">
                    Nuova versione disponibile ({updateInfo.latestVersion})
                  </span>
                  <span className="font-mono text-[11px] text-slate-400">
                    Attuale: {updateInfo.currentVersion}
                    {platform.isAndroidNative && updateInfo.apkSizeMb
                      ? ` · ${updateInfo.apkSizeMb}`
                      : ''}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate max-w-2xl">
                  {updateInfo.releaseName} — I salvataggi locali nei 3 slot restano intatti.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowChangelog((v) => !v)}
                className="px-2.5 py-1.5 rounded-lg bg-[#090D16] hover:bg-slate-800 border border-slate-700/80 text-[11px] font-medium text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Novità</span>
                {showChangelog ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {platform.isAndroidNative ? (
                <button
                  type="button"
                  disabled={isDownloading}
                  onClick={onDownload}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-bold flex items-center gap-1.5 transition-colors ${
                    isDownloading
                      ? 'bg-amber-500/40 text-slate-900 cursor-wait'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {isDownloading ? 'Avvio download...' : 'Scarica Aggiornamento (APK)'}
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isReloadingWebApp}
                  onClick={() => void handleWebAppReload()}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-display font-bold flex items-center gap-1.5 transition-colors ${
                    isReloadingWebApp
                      ? 'bg-cyan-500/40 text-slate-900 cursor-wait'
                      : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 cursor-pointer'
                  }`}
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 shrink-0 ${isReloadingWebApp ? 'animate-spin' : ''}`}
                  />
                  <span>{isReloadingWebApp ? 'Aggiornamento...' : 'Aggiorna App'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onDismiss}
                aria-label="Chiudi avviso aggiornamento"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showChangelog && (
            <div className="p-3 rounded-lg bg-[#090D16] border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="text-[11px] font-semibold text-amber-400">
                Changelog · {updateInfo.releaseName}
              </div>
              <p className="whitespace-pre-line leading-relaxed text-[11px] text-slate-300">
                {updateInfo.changelog}
              </p>
              <div className="pt-1.5 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Aggiornamento sicuro: la memoria locale (palazzo_chigi_saves_v1) non viene mai modificata o resettata.
                </span>
              </div>
            </div>
          )}

          {platform.isAndroidNative && downloadFeedback && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-emerald-300">
              {downloadFeedback}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. Avviso una-tantum iOS Safari (non standalone)
  if (showIosInstallBanner) {
    return (
      <div
        role="region"
        aria-label="Installa su iPhone o iPad"
        className="w-full bg-[#111827] border-b border-cyan-500/40 px-3 sm:px-5 py-2 shrink-0 z-30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Share className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-200 leading-snug">
              <span className="font-semibold text-cyan-300">Installa su iPhone/iPad:</span>{' '}
              Condividi → Aggiungi alla schermata Home
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismissIosHint}
            aria-label="Chiudi suggerimento installazione iOS"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // 3. Prompt Installazione Web App (PWA) su Chromium / Android Web
  if (showChromiumInstallBanner) {
    return (
      <div
        role="region"
        aria-label="Installa Web App"
        className="w-full bg-[#111827] border-b border-cyan-500/40 px-3 sm:px-5 py-2 shrink-0 z-30"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shrink-0">
              <Smartphone className="w-3.5 h-3.5" />
            </div>
            <p className="text-xs text-slate-200 truncate">
              Installa <strong className="text-slate-50">Palazzo Chigi // War Room</strong> come Web App a schermo intero.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => void handleInstallPwa()}
              className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-[11px] font-display font-bold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>Installa App</span>
            </button>
            <button
              type="button"
              onClick={handleDismissPwaHint}
              aria-label="Chiudi avviso installazione Web App"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
