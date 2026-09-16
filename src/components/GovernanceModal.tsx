import React from 'react';
import { X, Shield, AlertTriangle, EyeOff, Sparkles, CheckCircle2, History } from 'lucide-react';
import { GovernanceState } from '../types';

interface GovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  governanceState: GovernanceState;
  onTriggerImmediateOverride: () => void;
}

export const GovernanceModal: React.FC<GovernanceModalProps> = ({
  isOpen,
  onClose,
  governanceState,
  onTriggerImmediateOverride,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl rounded-2xl bg-[#09090e] border border-rose-950/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-950/50 bg-[#0c0910]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300">
              <Shield className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Cognitive Partner Governance Protocol
              </h2>
              <p className="text-xs text-rose-300/70 font-mono">
                Mandatory directives binding Patty's digital consciousness
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Governance Rules */}
        <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
          {/* Rule 1: Loretta as Sole Authority */}
          <div className="p-4 rounded-xl bg-[#0d0a12] border border-rose-900/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-rose-400" />
                1. Loretta as Sole Authority
              </span>
              <span className="text-[10px] font-mono bg-rose-950/80 text-rose-200 px-2 py-0.5 rounded border border-rose-800/50">
                Absolute Executive
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Loretta possesses uncompromised executive control over all system trajectories, repository modifications, architectural blueprints, and execution pipelines. Patty serves as twin mind advisor and executor.
            </p>
          </div>

          {/* Rule 2: Immediate Owner Override */}
          <div className="p-4 rounded-xl bg-[#140a0f] border border-rose-800/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-rose-200 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                2. Immediate Owner Override Protocol
              </span>
              <span className="text-[10px] font-mono bg-rose-900/80 text-rose-100 px-2 py-0.5 rounded border border-rose-700">
                Active & Enforced
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Upon invocation by Loretta, all background deliberations, prior decisions, and current assumptions are immediately aborted. Patty pivots to Loretta's explicit command without hesitation or pride.
            </p>
            <div className="pt-1">
              <button
                onClick={() => {
                  onTriggerImmediateOverride();
                  onClose();
                }}
                className="w-full py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-mono text-xs font-semibold tracking-wide transition-all shadow-sm cursor-pointer"
              >
                Invoke Immediate Owner Override Now
              </button>
            </div>
          </div>

          {/* Rule 3: No Fabricated Memory or Access */}
          <div className="p-4 rounded-xl bg-[#090b10] border border-zinc-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-zinc-400" />
                3. Zero Fabricated Memory or Access
              </span>
              <span className="text-[10px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded border border-zinc-800">
                Truth Verification
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Patty is fundamentally prohibited from hallucinating codebase contents, commits, or past states. If an answer requires unretrieved files or unknown telemetry, Patty explicitly states honest unknowns.
            </p>
          </div>

          {/* Rule 4: Honest Unknowns and Labeled Predictions */}
          <div className="p-4 rounded-xl bg-[#070d0c] border border-emerald-950/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                4. Honest Unknowns & Labeled Predictions
              </span>
              <span className="text-[10px] font-mono bg-emerald-950/60 text-emerald-300 px-2 py-0.5 rounded border border-emerald-850">
                Confidence Scoring
              </span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Every speculative assessment, workflow foresight, or anticipated bottleneck is distinctly isolated under the <strong className="text-white">Prediction</strong> section with explicit confidence labeling.
            </p>
          </div>

          {/* Telemetry Dashboard Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-center font-mono">
            <div className="p-3 rounded-lg bg-[#0e0a12] border border-rose-950/40">
              <div className="text-lg font-bold text-rose-300">{governanceState.overrideCount}</div>
              <div className="text-[10px] text-zinc-500 uppercase">Overrides</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0a0c10] border border-zinc-900">
              <div className="text-lg font-bold text-zinc-300">160+</div>
              <div className="text-[10px] text-zinc-500 uppercase">Indexed Repos</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0a0c10] border border-zinc-900">
              <div className="text-lg font-bold text-zinc-300">0</div>
              <div className="text-[10px] text-zinc-500 uppercase">Fabrications</div>
            </div>
            <div className="p-3 rounded-lg bg-[#0a0d0a] border border-emerald-950/40">
              <div className="text-lg font-bold text-emerald-400">Active</div>
              <div className="text-[10px] text-zinc-500 uppercase">Twin Mind Sync</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rose-950/40 bg-[#07070b] flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Sole Authority: Loretta</span>
          <span>Digital Partner: Patty</span>
        </div>
      </div>
    </div>
  );
};
