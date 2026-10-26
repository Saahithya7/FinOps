import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  X,
  Check,
  RotateCcw,
  Sparkles,
  Eye,
  Sliders,
  Shield,
  Layers,
  Moon,
  Sun,
  Palette,
} from 'lucide-react';

export const ThemeManagerModal: React.FC = () => {
  const {
    isThemeManagerOpen,
    setIsThemeManagerOpen,
    themeId,
    activeThemeId,
    previewThemeId,
    setTheme,
    startPreview,
    applyPreview,
    cancelPreview,
    restoreOriginalTheme,
    resetToDefault,
    mode,
    toggleMode,
    isOldMoney,
  } = useTheme();

  if (!isThemeManagerOpen) return null;

  const themes = [
    {
      id: 'original' as const,
      name: 'Original FinOps Blue',
      subtitle: 'Original Deep Midnight Navy & Electric Blue Fintech Suite',
      tag: 'Default Active',
      palette: [
        { label: 'Midnight Base', hex: '#0B1220' },
        { label: 'Surface Nav', hex: '#121C2D' },
        { label: 'Elevated Card', hex: '#18263E' },
        { label: 'Electric Blue', hex: '#2864F0' },
        { label: 'Teal Accent', hex: '#19D3A2' },
        { label: 'Cyan Signal', hex: '#38BDF8' },
        { label: 'White Surface', hex: '#FFFFFF' },
        { label: 'Fine Border', hex: '#1E293B' },
      ],
      description:
        'The restored production FinOps visual identity: deep midnight navy application background, dark blue-gray top navigation and sidebar, clean high-contrast white dashboard cards, electric blue primary actions, and vibrant teal telemetry indicators.',
      typography: 'Headings: Inter Sans · Body: Inter · Numerals: JetBrains Mono',
    },
    {
      id: 'old-money' as const,
      name: 'Old Money, New AI',
      subtitle: 'Preserved Archival Luxury Institutional Private Banking',
      tag: 'Preserved Alternate',
      palette: [
        { label: 'Warm Ivory', hex: '#F7F3EB' },
        { label: 'Antique Cream', hex: '#EEE5D7' },
        { label: 'Deep Burgundy', hex: '#641E2B' },
        { label: 'Oxblood', hex: '#42141D' },
        { label: 'Muted Brass', hex: '#B39A62' },
        { label: 'Ink Charcoal', hex: '#252321' },
        { label: 'Heritage Green', hex: '#36745B' },
        { label: 'Restrained Crimson', hex: '#B94A53' },
      ],
      description:
        'A secondary luxury private banking aesthetic with editorial headings, warm archival parchment tones, and muted brass accents, preserved so it is not lost.',
      typography: 'Headings: DM Serif Display · Body: Manrope · Numerals: Tabular Monospace',
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-modal-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col overflow-hidden max-h-[90vh] transition-all ${
          isOldMoney
            ? 'bg-[#F7F3EB] border-[#DDD3C4] text-[#252321]'
            : 'bg-[#0B1220] border-[#1E293B] text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isOldMoney
              ? 'bg-[#EEE5D7] border-[#DDD3C4]'
              : 'bg-[#121C2D] border-[#1E293B]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${
                isOldMoney
                  ? 'bg-[#FAF7F2] border-[#DDD3C4] text-[#641E2B]'
                  : 'bg-[#18263E] border-[#1E293B] text-[#2864F0]'
              }`}
            >
              <Palette className="w-5 h-5 text-[#2864F0]" />
            </div>
            <div>
              <h2
                id="theme-modal-title"
                className={`text-base font-bold tracking-tight ${
                  isOldMoney ? 'font-editorial-heading text-lg text-[#252321]' : 'text-white'
                }`}
              >
                FinOps Visual Themes &amp; Identity
              </h2>
              <p
                className={`text-xs ${
                  isOldMoney ? 'text-[#77716A]' : 'text-slate-400'
                }`}
              >
                Default active: <strong className="text-white">Original FinOps Blue</strong>. Switch or preview alternate styles below.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsThemeManagerOpen(false)}
            className={`p-1.5 rounded-lg transition cursor-pointer ${
              isOldMoney
                ? 'hover:bg-[#DDD3C4] text-[#77716A]'
                : 'hover:bg-[#1E293B] text-slate-400'
            }`}
            aria-label="Close theme manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          <div className="space-y-4">
            {themes.map((t) => {
              const isSelected = activeThemeId === t.id;
              const isSaved = themeId === t.id && previewThemeId === null;
              const isPreview = previewThemeId === t.id;

              return (
                <div
                  key={t.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isOldMoney
                      ? isSelected
                        ? 'bg-[#FAF7F2] border-[#641E2B] shadow-sm'
                        : 'bg-[#EEE5D7]/50 border-[#DDD3C4] hover:border-[#B39A62]'
                      : isSelected
                      ? 'bg-[#121C2D] border-[#2864F0] shadow-[0_0_15px_rgba(40,100,240,0.2)]'
                      : 'bg-[#121C2D]/40 border-[#1E293B] hover:border-slate-500'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className={`font-bold text-sm ${
                            isOldMoney && t.id === 'old-money'
                              ? 'font-editorial-heading text-base text-[#252321]'
                              : isOldMoney
                              ? 'text-[#252321]'
                              : 'text-white'
                          }`}
                        >
                          {t.name}
                        </h3>
                        <span
                          className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded border ${
                            t.id === 'original'
                              ? 'bg-[#2864F0]/20 text-[#38BDF8] border-[#2864F0]/40'
                              : isOldMoney
                              ? 'bg-[#FAF7F2] text-[#641E2B] border-[#DDD3C4]'
                              : 'bg-[#18263E] text-slate-300 border-[#1E293B]'
                          }`}
                        >
                          {t.tag}
                        </span>
                        {isSaved && (
                          <span
                            className={`text-[10px] font-semibold flex items-center gap-1 ${
                              t.id === 'original'
                                ? 'text-[#19D3A2]'
                                : isOldMoney
                                ? 'text-[#36745B]'
                                : 'text-[#19D3A2]'
                            }`}
                          >
                            <Check className="w-3 h-3" /> Active Default
                          </span>
                        )}
                        {isPreview && (
                          <span className="text-[10px] font-semibold text-amber-400 flex items-center gap-1">
                            <Eye className="w-3 h-3" /> In Preview
                          </span>
                        )}
                      </div>
                      <p
                        className={`text-xs mt-0.5 ${
                          isOldMoney ? 'text-[#77716A]' : 'text-slate-400'
                        }`}
                      >
                        {t.subtitle}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startPreview(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 ${
                          isOldMoney
                            ? 'bg-[#FAF7F2] hover:bg-[#EEE5D7] border-[#DDD3C4] text-[#252321]'
                            : 'bg-[#18263E] hover:bg-[#203252] border-[#1E293B] text-slate-200'
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        <span>Preview</span>
                      </button>

                      <button
                        onClick={() => setTheme(t.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs ${
                          t.id === 'original'
                            ? 'bg-[#2864F0] hover:bg-[#1E52CC] text-white'
                            : isOldMoney
                            ? 'bg-[#641E2B] hover:bg-[#42141D] text-white'
                            : 'bg-[#18263E] hover:bg-[#203252] text-white border border-[#1E293B]'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Apply Theme</span>
                      </button>
                    </div>
                  </div>

                  <p
                    className={`text-xs leading-relaxed mb-3 ${
                      isOldMoney ? 'text-[#252321]' : 'text-slate-300'
                    }`}
                  >
                    {t.description}
                  </p>

                  <div
                    className={`text-[11px] mb-3 font-mono ${
                      isOldMoney ? 'text-[#77716A]' : 'text-slate-400'
                    }`}
                  >
                    {t.typography}
                  </div>

                  {/* Swatches */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {t.palette.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border border-[#1E293B] bg-[#0B1220]/60"
                        title={`${p.label}: ${p.hex}`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                          style={{ backgroundColor: p.hex }}
                        />
                        <span className="text-slate-300 font-medium">{p.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Mode Toggle */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isOldMoney
                ? 'bg-[#EEE5D7] border-[#DDD3C4]'
                : 'bg-[#121C2D] border-[#1E293B]'
            }`}
          >
            <div>
              <span className="text-xs font-bold block">Appearance Lighting</span>
              <span
                className={`text-[11px] ${
                  isOldMoney ? 'text-[#77716A]' : 'text-slate-400'
                }`}
              >
                Signature FinOps aesthetic is <strong>Dark Navy</strong>. Currently configured in {mode.toUpperCase()} mode.
              </span>
            </div>

            <button
              onClick={toggleMode}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                isOldMoney
                  ? 'bg-[#FAF7F2] hover:bg-[#F7F3EB] border-[#DDD3C4] text-[#252321]'
                  : 'bg-[#18263E] hover:bg-[#203252] border-[#1E293B] text-slate-200'
              }`}
            >
              {mode === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" /> Switch to Light
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-blue-400" /> Switch to Dark
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer with Reset Actions */}
        <div
          className={`p-4 border-t flex flex-wrap items-center justify-between gap-3 ${
            isOldMoney
              ? 'bg-[#EEE5D7] border-[#DDD3C4]'
              : 'bg-[#121C2D] border-[#1E293B]'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                restoreOriginalTheme();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1 bg-[#2864F0] hover:bg-[#1E52CC] text-white border-[#2864F0]/40 shadow-xs"
              title="Revert completely to Original FinOps Blue Dashboard"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Restore Original Theme</span>
            </button>

            <button
              onClick={() => {
                resetToDefault();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer text-slate-400 hover:text-white"
            >
              Reset to Default
            </button>
          </div>

          <div className="flex items-center gap-2">
            {previewThemeId && (
              <>
                <button
                  onClick={cancelPreview}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
                    isOldMoney
                      ? 'bg-[#FAF7F2] border-[#DDD3C4] text-[#252321]'
                      : 'bg-[#18263E] border-[#1E293B] text-slate-300'
                  }`}
                >
                  Cancel Preview
                </button>
                <button
                  onClick={applyPreview}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer bg-[#2864F0] text-white hover:bg-[#1E52CC]"
                >
                  Apply Preview
                </button>
              </>
            )}

            <button
              onClick={() => setIsThemeManagerOpen(false)}
              className="px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer bg-white text-slate-900 hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
