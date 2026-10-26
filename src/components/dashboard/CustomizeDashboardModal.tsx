import React, { useState } from 'react';
import {
  SlidersHorizontal,
  X,
  Check,
  RotateCcw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layout,
  PieChart,
  BarChart3,
  LineChart,
  Grid,
} from 'lucide-react';
import { UserRole, DashboardWidgetConfig } from '../../types';
import {
  saveDashboardLayout,
  resetDashboardLayout,
} from '../../services/dashboardCustomizationService';

interface CustomizeDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: UserRole;
  userId: string;
  currentWidgets: DashboardWidgetConfig[];
  onApplyLayout: (widgets: DashboardWidgetConfig[]) => void;
}

export const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({
  isOpen,
  onClose,
  role,
  userId,
  currentWidgets,
  onApplyLayout,
}) => {
  const [widgets, setWidgets] = useState<DashboardWidgetConfig[]>(() => {
    return JSON.parse(JSON.stringify(currentWidgets));
  });

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, enabled: !w.enabled } : w))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= widgets.length) return;

    const copy = [...widgets];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);

    // Re-assign order numbers
    const reordered = copy.map((w, idx) => ({ ...w, order: idx + 1 }));
    setWidgets(reordered);
  };

  const handleChartTypeChange = (id: string, chartType: 'area' | 'bar' | 'line' | 'donut') => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, chartType } : w))
    );
  };

  const handleWidthChange = (id: string, width: 'full' | 'half') => {
    setWidgets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, width } : w))
    );
  };

  const handleReset = () => {
    const defaultWidgets = resetDashboardLayout(role, userId);
    setWidgets(JSON.parse(JSON.stringify(defaultWidgets)));
    onApplyLayout(defaultWidgets);
    onClose();
  };

  const handleSave = () => {
    saveDashboardLayout(role, userId, widgets);
    onApplyLayout(widgets);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-[#0B1220] border border-[#1E293B] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[90vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-[#1E293B] bg-[#121C2D] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#19D3A2]/15 text-[#19D3A2]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white">Customize {role} Dashboard</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18263E] text-slate-300 border border-[#1E293B]">
                  Role-Isolated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rearrange, toggle visibility, and configure chart visualizations
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-[#18263E] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          <div className="text-[11px] text-slate-400 flex items-center justify-between pb-2 border-b border-[#1E293B]/60">
            <span>Widget Component &amp; Controls</span>
            <span>Position &amp; Format</span>
          </div>

          {widgets.map((w, index) => {
            const hasChartOptions = w.category === 'chart';

            return (
              <div
                key={w.id}
                className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  w.enabled
                    ? 'bg-[#121C2D] border-[#1E293B]'
                    : 'bg-[#0B1220] border-[#1E293B]/40 opacity-60'
                }`}
              >
                {/* Left: Checkbox + Name + Description */}
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(w.id)}
                    className={`mt-0.5 p-1 rounded-lg border transition cursor-pointer ${
                      w.enabled
                        ? 'bg-[#19D3A2] border-[#19D3A2] text-[#0B1220]'
                        : 'bg-[#0B1220] border-[#1E293B] text-transparent hover:border-slate-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </button>

                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{w.title}</span>
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#18263E] text-slate-400 border border-[#1E293B]">
                        {w.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{w.description}</p>
                  </div>
                </div>

                {/* Right: Controls (Chart Type + Width + Move Up/Down) */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                  {/* Chart type selector if chart */}
                  {hasChartOptions && w.enabled && (
                    <div className="flex items-center bg-[#0B1220] p-1 rounded-lg border border-[#1E293B] text-[10px]">
                      {['donut', 'bar', 'area', 'line'].map((ct) => (
                        <button
                          key={ct}
                          type="button"
                          onClick={() => handleChartTypeChange(w.id, ct as any)}
                          className={`px-1.5 py-0.5 rounded capitalize transition cursor-pointer ${
                            w.chartType === ct
                              ? 'bg-[#19D3A2] text-[#0B1220] font-bold'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {ct}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Width selector */}
                  {w.enabled && w.category !== 'kpi' && (
                    <button
                      type="button"
                      onClick={() => handleWidthChange(w.id, w.width === 'full' ? 'half' : 'full')}
                      className="px-2 py-1 rounded-lg bg-[#0B1220] border border-[#1E293B] text-[10px] text-slate-300 hover:text-white font-mono cursor-pointer"
                      title="Toggle grid width"
                    >
                      {w.width === 'full' ? 'Full Width' : 'Half Width'}
                    </button>
                  )}

                  {/* Move Up / Down */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 rounded-lg bg-[#0B1220] hover:bg-[#18263E] border border-[#1E293B] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === widgets.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 rounded-lg bg-[#0B1220] hover:bg-[#18263E] border border-[#1E293B] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E293B] bg-[#121C2D] flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#18263E] rounded-xl transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore Default Layout
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:bg-[#18263E] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold bg-[#19D3A2] hover:bg-[#10B981] text-[#0B1220] rounded-xl transition shadow-sm cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" /> Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
