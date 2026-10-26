import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
  LifeBuoy,
  FileBarChart,
  CheckCircle2,
  ChevronRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CopilotMessage } from '../../types';

interface FinancialCopilotProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onToggleOpen?: () => void;
}

const SUGGESTED_QUESTIONS = [
  {
    icon: TrendingDown,
    label: 'Why did failed transactions increase?',
    prompt: 'Why did failed transactions increase recently? Analyze root cause categories and payment methods.',
  },
  {
    icon: ShieldAlert,
    label: 'Which transactions require investigation?',
    prompt: 'Which transactions require urgent risk or fraud investigation based on recent alerts?',
  },
  {
    icon: FileBarChart,
    label: "Summarize today's operational performance",
    prompt: "Summarize today's operational performance, settlement success rates, and supervised volume.",
  },
  {
    icon: LifeBuoy,
    label: 'Show unresolved high-priority support cases',
    prompt: 'Show unresolved high-priority and urgent support tickets requiring immediate SLA attention.',
  },
  {
    icon: Bot,
    label: "Explain this customer's recent transaction activity",
    prompt: "Explain customer transaction patterns, average ticket size, and potential velocity anomalies.",
  },
];

export const FinancialCopilot: React.FC<FinancialCopilotProps> = ({
  isOpen,
  onClose,
  onOpen,
  onToggleOpen,
}) => {
  const handleOpen = () => {
    if (onToggleOpen) onToggleOpen();
    else if (onOpen) onOpen();
  };

  const handleClose = () => {
    if (onToggleOpen) onToggleOpen();
    else if (onClose) onClose();
  };

  const { session, userRole } = useAuth();
  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      content: `Hello ${session?.user?.full_name?.split(' ')[0] || 'there'}. I am your Financial Operations Intelligence Copilot, grounded directly in verified Supabase records. What financial analysis or investigation can I assist with today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sources: ['Supabase Enterprise Data Warehouse'],
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState<{ configured: boolean; model: string; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check copilot backend status
    async function checkStatus() {
      try {
        const res = await fetch('/api/copilot/status');
        if (res.ok) {
          const data = await res.json();
          setStatusInfo(data);
        }
      } catch {
        setStatusInfo({
          configured: false,
          model: 'deterministic-analytics-engine',
          message: 'Copilot is operating in verified deterministic analytics mode.',
        });
      }
    }
    checkStatus();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputPrompt).trim();
    if (!query || isLoading) return;

    const userMsg: CopilotMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: query,
          role: userRole || 'Employee',
          customerId: session?.customerRecord?.id,
        }),
      });

      const data = await res.json();

      if (data.success && data.answer) {
        const assistantMsg: CopilotMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          content: data.answer,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          sources: data.sources || ['public.transactions', 'public.fraud_alerts'],
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: CopilotMessage = {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          content: data.error || 'Unable to retrieve financial telemetry at this time.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      const fallbackMsg: CopilotMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        content: `Error connecting to Copilot service: ${err?.message || 'Check network connection'}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={handleOpen}
          aria-label="Open Financial Intelligence Copilot"
          className="fixed bottom-6 right-6 z-40 p-3.5 bg-gradient-to-r from-[#19D3A2] via-[#38BDF8] to-[#A855F7] text-[#0B1220] rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2 font-bold text-xs cursor-pointer ai-glow-ring"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-[#0B1220]" />
          <span className="hidden sm:inline font-extrabold tracking-tight">FinOps Copilot</span>
          <span className="w-2 h-2 rounded-full bg-[#0B1220] animate-ping" />
        </button>
      )}

      {/* Slide-over Intelligence Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
          <div
            className={`h-full bg-[#0B1220] border-l border-[#1E293B] shadow-2xl flex flex-col transition-all duration-300 animate-slide-left text-slate-100 ${
              isExpanded ? 'w-full md:w-[720px]' : 'w-full sm:w-[480px]'
            }`}
          >
            {/* Copilot Header */}
            <div className="p-4 border-b border-[#1E293B] flex items-center justify-between bg-[#121C2D]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#19D3A2]/20 via-[#38BDF8]/20 to-[#A855F7]/20 border border-[#19D3A2]/40 flex items-center justify-center text-[#19D3A2]">
                  <Sparkles className="w-5 h-5 text-[#19D3A2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm tracking-tight text-white">Financial Copilot</h3>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#19D3A2]/15 text-[#19D3A2] border border-[#19D3A2]/30">
                      Grounded AI
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Real-time financial telemetry &amp; operations assistant
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#18263E] transition cursor-pointer hidden sm:block"
                  title={isExpanded ? 'Collapse width' : 'Expand width'}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#18263E] transition cursor-pointer"
                  title="Close Copilot"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Status / Configuration State Banner */}
            {statusInfo && !statusInfo.configured && (
              <div className="bg-[#18263E]/80 border-b border-[#1E293B] px-4 py-2.5 flex items-center gap-2.5 text-xs text-slate-300">
                <AlertCircle className="w-4 h-4 text-[#38BDF8] shrink-0" />
                <div className="text-[11px] leading-tight flex-1">
                  <span className="font-semibold text-[#38BDF8]">Deterministic Analytics Active: </span>
                  Answering from verified database records. Add <code className="text-[#19D3A2] font-mono font-bold">GEMINI_API_KEY</code> on server to enable neural LLM generation.
                </div>
              </div>
            )}

            {/* Suggested Quick Questions */}
            <div className="px-4 py-3 border-b border-[#1E293B] bg-[#0E1726] overflow-x-auto">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Suggested Financial Inquiries
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {SUGGESTED_QUESTIONS.map((q, idx) => {
                  const Icon = q.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(q.prompt)}
                      className="px-2.5 py-1.5 bg-[#121C2D] hover:bg-[#18263E] text-slate-300 hover:text-white border border-[#1E293B] rounded-xl text-[11px] font-medium whitespace-nowrap transition flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Icon className="w-3.5 h-3.5 text-[#19D3A2]" />
                      <span>{q.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => {
                const isAssistant = msg.sender === 'assistant';
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${isAssistant ? 'justify-start' : 'justify-end'}`}
                  >
                    {isAssistant && (
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#19D3A2]/20 to-[#38BDF8]/20 border border-[#19D3A2]/30 flex items-center justify-center shrink-0 text-[#19D3A2] mt-0.5">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 ${
                        isAssistant
                          ? 'bg-[#121C2D] border border-[#1E293B] text-slate-200'
                          : 'bg-[#19D3A2] text-[#0B1220] font-medium'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.content}</div>

                      {/* Assistant footer: sources and copy button */}
                      {isAssistant && (
                        <div className="pt-2 border-t border-[#1E293B]/60 flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1.5 truncate">
                            {msg.sources?.map((s, i) => (
                              <span
                                key={i}
                                className="font-mono text-[9px] bg-[#0B1220] px-1.5 py-0.5 rounded border border-[#1E293B] text-slate-400 truncate"
                              >
                                {s}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span>{msg.timestamp}</span>
                            <button
                              onClick={() => handleCopy(msg.id, msg.content)}
                              className="text-slate-400 hover:text-white transition p-1 cursor-pointer"
                              title="Copy answer"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3 h-3 text-[#19D3A2]" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {!isAssistant && (
                      <div className="w-7 h-7 rounded-xl bg-[#18263E] border border-[#1E293B] flex items-center justify-center shrink-0 text-slate-300 mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}

              {isLoading && (
                <div className="flex items-center gap-3 text-xs text-slate-400 bg-[#121C2D] border border-[#1E293B] rounded-2xl p-3.5 w-fit">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#19D3A2]" />
                  <span>Synthesizing verified Supabase telemetry...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#1E293B] bg-[#121C2D]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  placeholder="Ask a question about transactions, failure rates, fraud, or SLA..."
                  disabled={isLoading}
                  className="flex-1 bg-[#0B1220] border border-[#1E293B] rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-[#19D3A2] transition"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputPrompt.trim()}
                  className="px-4 py-2.5 bg-[#19D3A2] hover:bg-[#10B981] disabled:opacity-40 text-[#0B1220] font-bold rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Ask</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
