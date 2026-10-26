import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Check, X, Sparkles } from 'lucide-react';

export const ThemePreviewRibbon: React.FC = () => {
  const {
    isPreviewing,
    previewThemeId,
    applyPreview,
    cancelPreview,
    isOldMoney,
  } = useTheme();

  if (!isPreviewing) return null;

  const previewName =
    previewThemeId === 'old-money' ? 'Old Money, New AI' : 'Original FinOps Blue';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`sticky top-0 z-50 px-4 py-2 text-xs border-b transition-all duration-200 flex items-center justify-between shadow-md ${
        isOldMoney
          ? 'bg-[#EEE5D7] border-[#DDD3C4] text-[#252321]'
          : 'bg-[#18263E] border-[#1E293B] text-slate-100'
      }`}
    >
      <div className="flex items-center gap-2">
        <Sparkles
          className={`w-3.5 h-3.5 ${
            isOldMoney ? 'text-[#641E2B]' : 'text-[#19D3A2]'
          }`}
        />
        <span>
          <strong className="font-semibold">Theme Preview Active:</strong> You
          are previewing <em>{previewName}</em>. Changes are not saved until
          applied.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={cancelPreview}
          className={`px-3 py-1 rounded text-xs font-medium transition cursor-pointer flex items-center gap-1 border ${
            isOldMoney
              ? 'bg-[#FAF7F2] hover:bg-[#F7F3EB] border-[#DDD3C4] text-[#252321]'
              : 'bg-[#121C2D] hover:bg-[#0B1220] border-[#1E293B] text-slate-300'
          }`}
        >
          <X className="w-3 h-3" />
          <span>Cancel Preview</span>
        </button>

        <button
          onClick={applyPreview}
          className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-sm ${
            isOldMoney
              ? 'bg-[#641E2B] hover:bg-[#42141D] text-white'
              : 'bg-[#2864F0] hover:bg-[#1E52CC] text-white'
          }`}
        >
          <Check className="w-3 h-3" />
          <span>Apply Theme</span>
        </button>
      </div>
    </div>
  );
};
