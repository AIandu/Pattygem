import React, { useState } from 'react';
import { X, BrainCircuit, Play, Sparkles, AlertTriangle, Layers, Cpu, ShieldAlert } from 'lucide-react';
import { GitHubRepo } from '../types';

interface ScenarioSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeRepo: GitHubRepo | null;
  onRunSimulation: (scenarioTitle: string, scenarioPrompt: string) => void;
}

const PRESET_SCENARIOS = [
  {
    id: 'scale-surge',
    title: 'Distributed System Traffic Surge (100k req/sec)',
    icon: Cpu,
    category: 'Architecture & Load',
    description: 'Simulate connection pool exhaustion, cache eviction cascade, and downstream microservice degradation under 10x sudden volume.',
    prompt: 'Simulate a sudden 100k requests/second traffic spike against our core architecture. Identify the first point of failure, analyze thread contention, and recommend an immediate mitigation plan.',
  },
  {
    id: 'multi-repo-refactor',
    title: 'Cross-Repository Breaking Dependency Rollout',
    icon: Layers,
    category: 'Ecosystem Refactor',
    description: 'Simulate releasing a breaking API contract change across Loretta’s 160+ interconnected repositories with zero downtime.',
    prompt: 'Simulate a breaking protobuf/schema change across our 160+ repository ecosystem. Propose a phased dual-write deployment sequence with backward compatibility safeguards.',
  },
  {
    id: 'zero-day-audit',
    title: 'Critical Zero-Day Supply Chain Incident',
    icon: ShieldAlert,
    category: 'Security & Integrity',
    description: 'Simulate an emergency zero-day vulnerability detected in an upstream package common across 40+ repositories.',
    prompt: 'Simulate discovering an active RCE zero-day in a foundational transitive dependency across our services. Provide a rapid audit vector, isolated containment decision, and automated patch strategy.',
  },
  {
    id: 'database-deadlock',
    title: 'Distributed State & Migration Partition',
    icon: AlertTriangle,
    category: 'State & Storage',
    description: 'Simulate distributed consensus partition during an online schema migration.',
    prompt: 'Simulate an unexpected network split during a live zero-downtime database migration. Detail rollback heuristics, split-brain avoidance, and data integrity reconciliation.',
  },
];

export const ScenarioSimulatorModal: React.FC<ScenarioSimulatorModalProps> = ({
  isOpen,
  onClose,
  activeRepo,
  onRunSimulation,
}) => {
  const [customScenario, setCustomScenario] = useState('');

  if (!isOpen) return null;

  const handleRunPreset = (scenario: typeof PRESET_SCENARIOS[0]) => {
    onRunSimulation(scenario.title, scenario.prompt);
    onClose();
  };

  const handleRunCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customScenario.trim()) return;
    onRunSimulation('Custom Scenario Simulation', customScenario.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl bg-[#09090e] border border-rose-950/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-950/50 bg-[#0c0910]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Cognitive Scenario Simulator
              </h2>
              <p className="text-xs text-rose-300/70 font-mono">
                Anticipate edge-case failures, evaluate architecture stress, and test hypotheses
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Preset Simulation Scenarios */}
          <div className="space-y-3">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              Select Strategic Simulation
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {PRESET_SCENARIOS.map((scenario) => {
                const Icon = scenario.icon;
                return (
                  <div
                    key={scenario.id}
                    className="p-4 rounded-xl bg-[#0d0d14] border border-zinc-800/90 hover:border-rose-800/60 transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="p-2 rounded-lg bg-rose-950/50 border border-rose-900/40 text-rose-400 group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4" />
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                          {scenario.category}
                        </span>
                      </div>
                      <h3 className="font-semibold text-white text-sm group-hover:text-rose-300 transition-colors">
                        {scenario.title}
                      </h3>
                      <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed">
                        {scenario.description}
                      </p>
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => handleRunPreset(scenario)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/50 text-xs font-mono text-rose-200 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 text-rose-400" />
                        Run Simulation
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Scenario Formulation */}
          <form onSubmit={handleRunCustom} className="space-y-3 pt-2">
            <div className="text-xs font-mono text-zinc-400 uppercase tracking-wider font-semibold">
              Or Define Custom Problem-Solving Scenario
            </div>
            <textarea
              rows={3}
              value={customScenario}
              onChange={(e) => setCustomScenario(e.target.value)}
              placeholder="e.g. What happens if our primary cache goes down during high traffic? Simulate step-by-step impact on our 160+ microservices..."
              className="w-full p-3 rounded-xl bg-[#07070b] border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:border-rose-600 focus:outline-none font-sans"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!customScenario.trim()}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium transition-all ${
                  customScenario.trim()
                    ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md'
                    : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Simulate Scenario with Patty
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rose-950/40 bg-[#07070b] flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Targeting: {activeRepo ? activeRepo.name : 'All 160+ Repos'}</span>
          <span>Authority: Loretta</span>
        </div>
      </div>
    </div>
  );
};
