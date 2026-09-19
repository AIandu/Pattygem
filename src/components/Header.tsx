import React from 'react';
import {
  Shield,
  FolderGit2,
  AlertTriangle,
  Settings,
  Volume2,
  VolumeX,
  Trash2,
  BrainCircuit,
  Users,
  Zap,
  Gem,
  FolderKanban,
  Folder,
} from 'lucide-react';
import { GitHubRepo, GovernanceState, GitHubAccount } from '../types';

interface HeaderProps {
  activeRepo: GitHubRepo | null;
  repoCount: number;
  governanceState: GovernanceState;
  accounts: GitHubAccount[];
  activeAccountFilter: string;
  onSelectAccountFilter: (filter: string) => void;
  modelTier: 'flash' | 'pro';
  onToggleModelTier: () => void;
  onOpenRepoSelector: () => void;
  onTriggerOverride: () => void;
  onOpenSettings: () => void;
  onOpenGovernance: () => void;
  onOpenSimulator: () => void;
  onClearHistory: () => void;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  autoSpeak: boolean;
  onOpenTodoBoard?: () => void;
  onOpenUploadsFolder?: () => void;
  uploadsCount?: number;
  pendingTodosCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeRepo,
  repoCount,
  governanceState,
  accounts,
  activeAccountFilter,
  onSelectAccountFilter,
  modelTier,
  onToggleModelTier,
  onOpenRepoSelector,
  onTriggerOverride,
  onOpenSettings,
  onOpenGovernance,
  onOpenSimulator,
  onClearHistory,
  isSpeaking,
  onToggleSpeech,
  autoSpeak,
  onOpenTodoBoard,
  onOpenUploadsFolder,
  uploadsCount = 0,
  pendingTodosCount = 0,
}) => {
  const configuredAccounts = accounts.filter((a) => a.username?.trim());

  return (
    <header className="sticky top-0 z-30 w-full border-b border-pink-950/40 bg-[#050407]/95 backdrop-blur-md px-3 sm:px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left: AI&U Small Banner + Patty Head Avatar Branding */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* AI&U Brand Badge */}
          <div className="flex items-center rounded-xl bg-[#120813] border border-pink-500/30 px-2.5 py-1.5 shadow-sm">
            <span className="text-[11px] font-mono font-bold text-pink-300 tracking-wider">
              AI&U
            </span>
          </div>

          {/* Patty Head Icon + Twin Mind Badge */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <img
                src="/patty_avatar.jpg"
                alt="Patty"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
                className="w-8 h-8 rounded-full border border-pink-400/60 object-cover shadow-sm ring-1 ring-pink-500/30"
              />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
              </span>
            </div>

            <div className="hidden min-[480px]:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-tight text-white flex items-center gap-1 font-mono">
                  PATTY
                  <span className="text-[9px] font-mono text-pink-300 uppercase px-1 rounded bg-pink-950/70 border border-pink-500/30">
                    Twin Mind
                  </span>
                </h1>
              </div>
              <p className="text-[10px] text-pink-300/70 font-mono">
                Synchronized for Loretta
              </p>
            </div>
          </div>
        </div>

        {/* Center: Dual GitHub Accounts & Quick Folder Launchers */}
        <div className="hidden lg:flex items-center gap-2">
          {/* Dual GitHub Accounts Switcher */}
          <div className="flex items-center rounded-lg bg-[#0c0811] border border-pink-950/60 p-0.5">
            <button
              onClick={() => onSelectAccountFilter('all')}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer ${
                activeAccountFilter === 'all'
                  ? 'bg-pink-950/80 text-pink-100 border border-pink-500/40 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="View repositories combined from both GitHub accounts"
            >
              <Users className="w-3 h-3 text-pink-400" />
              <span>Dual GitHub ({repoCount})</span>
            </button>

            {configuredAccounts.map((acc) => (
              <button
                key={acc.id}
                onClick={() => onSelectAccountFilter(acc.id)}
                className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                  activeAccountFilter === acc.id
                    ? 'bg-pink-950/80 text-pink-100 border border-pink-500/40 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Filter to @${acc.username}`}
              >
                @{acc.username}
              </button>
            ))}
          </div>

          {/* Active Repo Indicator / Selector */}
          <button
            id="repo-selector-btn"
            onClick={onOpenRepoSelector}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0d0712] border border-zinc-800 hover:border-pink-500/50 text-xs text-zinc-300 transition-all hover:bg-zinc-900 cursor-pointer group"
          >
            <FolderGit2 className="w-3.5 h-3.5 text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="truncate max-w-[120px] font-mono text-[11px]">
              {activeRepo ? activeRepo.name : `${repoCount}+ Repos`}
            </span>
          </button>
        </div>

        {/* Right: Quick Action Folders & Control Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Expandable To-Do Board Folder Launcher */}
          {onOpenTodoBoard && (
            <button
              onClick={onOpenTodoBoard}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#140a17] border border-pink-500/30 hover:border-pink-400 text-xs font-mono text-pink-200 hover:text-white transition-all cursor-pointer"
              title="Open Loretta's Expandable Project & To-Do Board"
            >
              <FolderKanban className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px] hidden sm:inline">To-Do Board</span>
              {pendingTodosCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                  {pendingTodosCount}
                </span>
              )}
            </button>
          )}

          {/* Uploads Folder Launcher */}
          {onOpenUploadsFolder && (
            <button
              onClick={onOpenUploadsFolder}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#140a17] border border-pink-500/30 hover:border-pink-400 text-xs font-mono text-pink-200 hover:text-white transition-all cursor-pointer"
              title="Open Loretta's Uploads Folder (Bottom Left)"
            >
              <Folder className="w-3.5 h-3.5 text-pink-400" />
              <span className="text-[11px] hidden sm:inline">Uploads</span>
              {uploadsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-pink-500/30 text-pink-200 text-[9px]">
                  {uploadsCount}
                </span>
              )}
            </button>
          )}

          {/* Model Reasoning Engine Tier (Flash vs Pro Paid) */}
          <button
            id="model-tier-toggle-btn"
            onClick={onToggleModelTier}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
              modelTier === 'pro'
                ? 'bg-pink-950/70 border-pink-500/60 text-pink-100 shadow-sm'
                : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white'
            }`}
            title={
              modelTier === 'pro'
                ? 'Gemini Pro (Deep Architectural Simulation)'
                : 'Gemini Flash (Rapid Predictive Inference)'
            }
          >
            {modelTier === 'pro' ? (
              <>
                <Gem className="w-3 h-3 text-pink-400 animate-pulse" />
                <span className="font-semibold text-pink-200">Pro</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-amber-400" />
                <span>Flash</span>
              </>
            )}
          </button>

          {/* Immediate Owner Override Trigger */}
          <button
            id="owner-override-btn"
            onClick={onTriggerOverride}
            className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg bg-[#240c1c] hover:bg-[#341128] border border-pink-400 text-pink-100 text-xs font-medium shadow-sm transition-all cursor-pointer"
            title="Immediate Owner Override: Halt current vector and command immediate pivot"
          >
            <AlertTriangle className="w-3 h-3 text-pink-400 animate-pulse" />
            <span className="font-mono text-[10px] font-semibold tracking-wider">
              OVERRIDE
            </span>
          </button>

          {/* Voice Output Toggle */}
          <button
            id="speech-toggle-btn"
            onClick={onToggleSpeech}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              autoSpeak || isSpeaking
                ? 'bg-pink-950/60 border-pink-500 text-pink-200 shadow-sm'
                : 'bg-zinc-900/50 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
            title={autoSpeak ? 'Disable Voice Playback' : 'Enable Voice Playback'}
          >
            {autoSpeak ? <Volume2 className="w-3.5 h-3.5 text-pink-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Settings Modal */}
          <button
            id="settings-btn"
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-pink-500/50 text-zinc-400 hover:text-pink-300 transition-all cursor-pointer"
            title="Dual GitHub & Paid Gemini API Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Clear Session */}
          <button
            id="clear-history-btn"
            onClick={onClearHistory}
            className="p-1.5 rounded-lg bg-zinc-900/30 border border-zinc-800/80 hover:border-red-900/50 text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
            title="Clear Chat History"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};

