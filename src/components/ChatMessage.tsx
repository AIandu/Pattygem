import React, { useState } from 'react';
import { PattyMessage } from '../types';
import {
  Sparkles,
  Compass,
  AlertOctagon,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Volume2,
  ShieldAlert,
  GitBranch,
  Brain,
  ListTodo,
} from 'lucide-react';
import Markdown from 'react-markdown';

interface ChatMessageProps {
  message: PattyMessage;
  onExpandDecision?: (msgId: string) => void;
  onSpeak?: (text: string) => void;
  pattyAvatarSrc?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onExpandDecision,
  onSpeak,
  pattyAvatarSrc = '/patty_avatar.jpg',
}) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);
  const [isElaborationOpen, setIsElaborationOpen] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end my-3 px-2 sm:px-4">
        <div className="flex items-start gap-2.5 max-w-2xl">
          {/* User Box - Pastel Yellow with subtle borders and clean typography */}
          <div
            className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 border transition-all ${
              message.isOverride
                ? 'bg-[#29170e] border-amber-500/80 text-amber-100 shadow-lg shadow-amber-950/40'
                : 'bg-[#18160c] border-yellow-300/35 text-yellow-100/95 shadow-md shadow-yellow-950/20'
            }`}
          >
            {message.isOverride && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-amber-300 font-semibold mb-1 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                Immediate Owner Override
              </div>
            )}
            <p className="text-sm md:text-[15px] leading-relaxed whitespace-pre-wrap font-sans text-yellow-50/90">
              {message.content}
            </p>
            <div className="text-[10px] font-mono text-yellow-200/50 mt-1.5 text-right">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>

          {/* User Avatar - Initial L */}
          <div
            className="flex-shrink-0 w-8 h-8 rounded-full bg-[#2a2410] border border-yellow-300/60 flex items-center justify-center text-yellow-200 font-bold font-mono text-sm shadow-sm"
            title="Loretta Chapman (Sole Authority)"
          >
            L
          </div>
        </div>
      </div>
    );
  }

  // Assistant (Patty) structured rendering - Centered, Pale Pastel Pink Theme
  const { sections } = message;
  const hasStructured =
    sections &&
    (sections.directive ||
      sections.response ||
      sections.prediction ||
      sections.primaryRisk ||
      sections.memoryNotes ||
      sections.decision);

  return (
    <div className="my-4 px-1 sm:px-3">
      <div className="max-w-3xl mx-auto rounded-2xl bg-[#140b13] border border-pink-300/30 shadow-xl shadow-pink-950/20 overflow-hidden">
        {/* Patty Header with Head Icon */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#1b0d19] border-b border-pink-300/20 text-xs">
          <div className="flex items-center gap-2.5">
            {/* Patty Head Icon */}
            <div className="relative flex-shrink-0">
              <img
                src={pattyAvatarSrc}
                alt="Patty Twin Mind"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to elegant styled emblem if image path fails
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-7 h-7 rounded-full border border-pink-300/60 object-cover shadow-sm ring-1 ring-pink-400/30"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-pink-200 tracking-wide text-[13px]">
                PATTY
              </span>
              <span className="text-[10px] font-mono text-pink-300/60 hidden sm:inline">
                // Cognitive Predictive Brain
              </span>
            </div>

            {message.repoRef && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-pink-300 bg-pink-950/50 px-2 py-0.5 rounded border border-pink-400/30">
                <GitBranch className="w-3 h-3" />
                {message.repoRef}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-pink-300/70">
            <span className="text-[10px] font-mono text-pink-300/50">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {onSpeak && (
              <button
                onClick={() => onSpeak(sections?.directive || sections?.response || message.content)}
                className="p-1 hover:text-pink-100 transition-colors cursor-pointer"
                title="Read response aloud"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleCopy}
              className="p-1 hover:text-pink-100 transition-colors cursor-pointer"
              title="Copy output"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-pink-300" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Structured Sections - Pale Pastel Pink container text and contrast */}
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {hasStructured ? (
            <>
              {/* 1. Directive (What to do now, next, later) */}
              {(sections?.directive || sections?.response) && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-pink-300 uppercase">
                    <ListTodo className="w-3.5 h-3.5 text-pink-400" />
                    Directive (Now / Next / Later)
                  </div>
                  <div className="text-pink-50/95 text-sm md:text-[15px] leading-relaxed font-sans markdown-body">
                    <Markdown>{sections.directive || sections.response}</Markdown>
                  </div>
                </div>
              )}

              {/* 2. Prediction (Expected outcome + confidence) */}
              {sections?.prediction && (
                <div className="rounded-xl p-3.5 sm:p-4 bg-[#1e0e1b] border border-pink-400/25 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-pink-300 uppercase">
                      <Compass className="w-3.5 h-3.5 text-pink-400" />
                      Prediction & Confidence
                    </div>
                    <span className="text-[10px] font-mono text-pink-200 bg-pink-950/80 px-2 py-0.5 rounded border border-pink-500/40">
                      Disclosed As Prediction
                    </span>
                  </div>
                  <div className="text-pink-100/90 text-sm leading-relaxed font-sans">
                    <Markdown>{sections.prediction}</Markdown>
                  </div>
                </div>
              )}

              {/* 3. Primary Risk (Single point of risk) */}
              {(sections?.primaryRisk || sections?.decision) && (
                <div className="rounded-xl p-3.5 sm:p-4 bg-[#190c17] border border-pink-400/20 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-rose-300 uppercase">
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-400" />
                      Primary Risk & Decision
                    </div>
                    <span className="text-[10px] font-mono text-rose-300/80 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/40">
                      Single Risk Focus
                    </span>
                  </div>
                  <div className="text-pink-100/85 text-sm leading-relaxed font-sans">
                    <Markdown>{sections.primaryRisk || sections.decision}</Markdown>
                  </div>
                </div>
              )}

              {/* 4. Memory Notes (Updates or honest unknowns) */}
              {sections?.memoryNotes && (
                <div className="rounded-xl p-3 bg-[#110910] border border-pink-400/15 space-y-1">
                  <div className="flex items-center gap-2 text-[11px] font-mono font-semibold tracking-wider text-pink-300/80 uppercase">
                    <Brain className="w-3 h-3 text-pink-400" />
                    Memory Notes & Verified Boundaries
                  </div>
                  <div className="text-pink-200/75 text-xs font-mono leading-relaxed">
                    <Markdown>{sections.memoryNotes}</Markdown>
                  </div>
                </div>
              )}

              {/* 5. Deep Elaboration (Collapsible) */}
              {sections?.elaboration ? (
                <div className="border-t border-pink-300/20 pt-3">
                  <button
                    onClick={() => setIsElaborationOpen(!isElaborationOpen)}
                    className="flex items-center justify-between w-full text-xs font-mono text-pink-300 hover:text-pink-100 transition-colors py-1 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 uppercase tracking-wider font-semibold">
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      Deep Architectural Elaboration
                    </span>
                    {isElaborationOpen ? (
                      <ChevronUp className="w-4 h-4 text-pink-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-pink-300/50" />
                    )}
                  </button>

                  {isElaborationOpen && (
                    <div className="mt-2.5 p-3.5 rounded-xl bg-[#0f070e] border border-pink-400/20 text-xs text-pink-100/90 leading-relaxed font-sans">
                      <Markdown>{sections.elaboration}</Markdown>
                    </div>
                  )}
                </div>
              ) : (
                onExpandDecision && (
                  <div className="pt-1">
                    <button
                      onClick={() => onExpandDecision(message.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-950/40 hover:bg-pink-900/50 border border-pink-400/30 text-xs font-mono text-pink-200 hover:text-white transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-pink-400" />
                      Simulate Options & Failure Modes
                    </button>
                  </div>
                )
              )}
            </>
          ) : (
            // Raw text fallback
            <div className="text-pink-50/95 text-sm md:text-[15px] leading-relaxed markdown-body">
              <Markdown>{message.content}</Markdown>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
