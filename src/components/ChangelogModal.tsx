import React, { useEffect, useMemo, useState } from 'react';
import {
  CHANGELOG_RELEASES,
  ChangelogTag,
  LATEST_CHANGELOG_VERSION,
} from '../data/changelog';
import {
  CheckCircle2,
  History,
  Scale,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';

interface ChangelogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TagFilter = 'tutti' | ChangelogTag;

const TAG_STYLE_MAP: Record<
  ChangelogTag,
  { text: string; icon: React.ReactNode }
> = {
  'Nuove Funzioni': {
    text: 'text-cyan-300',
    icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />,
  },
  Bilanciamento: {
    text: 'text-amber-300',
    icon: <Scale className="w-3.5 h-3.5 text-amber-400 shrink-0" />,
  },
  'Bug Risolti': {
    text: 'text-emerald-300',
    icon: <Wrench className="w-3.5 h-3.5 text-emerald-400 shrink-0" />,
  },
};

export const ChangelogModal: React.FC<ChangelogModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [filter, setFilter] = useState<TagFilter>('tutti');

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const filteredReleases = useMemo(() => {
    if (filter === 'tutti') return CHANGELOG_RELEASES;
    return CHANGELOG_RELEASES.map((release) => ({
      ...release,
      items: release.items.filter((item) => item.tag === filter),
    })).filter((release) => release.items.length > 0);
  }, [filter]);

  if (!isOpen) return null;

  const filters: { id: TagFilter; label: string }[] = [
    { id: 'tutti', label: 'Tutte le voci' },
    { id: 'Nuove Funzioni', label: 'Nuove Funzioni' },
    { id: 'Bilanciamento', label: 'Bilanciamento' },
    { id: 'Bug Risolti', label: 'Bug Risolti' },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="changelog-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center safe-area-modal-backdrop sm:p-5 overflow-hidden"
    >
      <div className="w-full max-w-3xl max-h-[90dvh] bg-[#111827] border border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-4 sm:px-6 py-4 bg-[#0D1322] border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
              <History className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-mono text-cyan-300 tabular-nums">
                Versione corrente v{LATEST_CHANGELOG_VERSION}
              </span>
              <span aria-hidden="true">·</span>
              <span>Registro modifiche ufficiali</span>
            </div>
            <h2
              id="changelog-modal-title"
              className="text-lg sm:text-xl font-bold text-slate-50 leading-snug"
            >
              Novità &amp; Aggiornamenti
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi finestra novità e aggiornamenti"
            className="p-2 rounded-lg bg-[#111827] hover:bg-slate-800 border border-slate-700/80 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Interactive Filter Segmented Bar */}
        <div className="px-4 sm:px-6 py-3 bg-[#0B101D] border-b border-slate-800/90 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div
            role="tablist"
            aria-label="Filtra modifiche per categoria"
            className="flex flex-wrap items-center gap-1 p-1 bg-[#090D16] border border-slate-800 rounded-lg"
          >
            {filters.map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-slate-800 text-slate-50'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-slate-400 font-mono tabular-nums">
            {CHANGELOG_RELEASES.length} versioni documentate
          </span>
        </div>

        {/* Releases Timeline Body */}
        <div className="flex-1 min-h-0 overflow-y-auto war-scroll px-4 sm:px-6 py-5 space-y-6">
          {filteredReleases.map((release, relIdx) => {
            const isLatest = relIdx === 0 && release.version === LATEST_CHANGELOG_VERSION;
            return (
              <article
                key={release.version}
                className={`space-y-4 ${
                  relIdx > 0 ? 'pt-6 border-t border-slate-800/90' : ''
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-mono font-bold text-slate-100 tabular-nums">
                      v{release.version}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{release.date}</span>
                    {isLatest && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-cyan-300">
                          Ultima versione
                        </span>
                      </>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-50 leading-snug">
                    {release.headline}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {release.summary}
                  </p>
                </div>

                <ul className="divide-y divide-slate-800/75 rounded-xl bg-[#090D16] border border-slate-800/90">
                  {release.items.map((item, idx) => {
                    const meta = TAG_STYLE_MAP[item.tag];
                    return (
                      <li
                        key={`${release.version}_${idx}`}
                        className="p-3.5 sm:p-4 space-y-1.5"
                      >
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className={`inline-flex items-center gap-1.5 font-semibold ${meta.text}`}>
                            {meta.icon}
                            <span>{item.tag}</span>
                          </span>
                          <span aria-hidden="true" className="text-slate-600">
                            ·
                          </span>
                          <span className="font-semibold text-slate-100">
                            {item.title}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {item.detail}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </article>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="px-4 sm:px-6 pt-3.5 safe-area-modal-footer bg-[#0D1322] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              I bilanciamenti del motore di simulazione si applicano automaticamente anche ai salvataggi esistenti.
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-display font-bold text-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Chiudi
          </button>
        </footer>
      </div>
    </div>
  );
};
