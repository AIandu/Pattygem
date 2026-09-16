import React, { useState } from 'react';
import { X, Settings, Key, Volume2, Download, Trash2, Shield, User, Zap, Gem, Check } from 'lucide-react';
import { UserPreferences, PattyMessage, GitHubAccount } from '../types';
import { exportChatToMarkdown } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferences: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  messages: PattyMessage[];
  onClearHistory: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  preferences,
  onSavePreferences,
  messages,
  onClearHistory,
}) => {
  // Accounts
  const initialAccounts: GitHubAccount[] =
    preferences.accounts && preferences.accounts.length >= 2
      ? preferences.accounts
      : [
          {
            id: 'account_1',
            label: 'Primary GitHub',
            username: preferences.githubUsername || 'loretta',
            token: preferences.githubToken || '',
            isConfigured: true,
          },
          {
            id: 'account_2',
            label: 'Secondary GitHub',
            username: preferences.accounts?.[1]?.username || 'loretta-labs',
            token: preferences.accounts?.[1]?.token || '',
            isConfigured: true,
          },
        ];

  const [accounts, setAccounts] = useState<GitHubAccount[]>(initialAccounts);
  const [modelTier, setModelTier] = useState<'flash' | 'pro'>(preferences.modelTier || 'flash');
  const [customGeminiApiKey, setCustomGeminiApiKey] = useState(preferences.customGeminiApiKey || '');
  const [autoSpeak, setAutoSpeak] = useState(preferences.autoSpeak || false);
  const [savedNotice, setSavedNotice] = useState(false);

  if (!isOpen) return null;

  const handleUpdateAccount = (id: string, updates: Partial<GitHubAccount>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePreferences({
      ...preferences,
      accounts,
      githubUsername: accounts[0]?.username?.trim() || 'loretta',
      githubToken: accounts[0]?.token?.trim() || '',
      modelTier,
      customGeminiApiKey: customGeminiApiKey.trim(),
      autoSpeak,
    });
    setSavedNotice(true);
    setTimeout(() => {
      setSavedNotice(false);
      onClose();
    }, 800);
  };

  const handleExport = () => {
    const md = exportChatToMarkdown(messages);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patty-loretta-transcript-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-[#09090e] border border-rose-950/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-950/50 bg-[#0c0910]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                Patty Twin Mind Settings
              </h2>
              <p className="text-xs text-rose-300/70 font-mono">
                Dual GitHub accounts, Gemini Paid API tier, and local storage configuration
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

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Dual GitHub Connection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
                <User className="w-4 h-4 text-rose-400" />
                Dual GitHub Accounts (160+ Projects Access)
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Stored locally in browser</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {accounts.map((acc, index) => (
                <div key={acc.id} className="p-3.5 rounded-xl bg-[#07070b] border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-rose-300 font-semibold">
                      Account {index + 1}
                    </span>
                    <input
                      type="text"
                      value={acc.label}
                      onChange={(e) => handleUpdateAccount(acc.id, { label: e.target.value })}
                      placeholder={index === 0 ? "Primary" : "Secondary"}
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 w-28 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Username</label>
                    <input
                      type="text"
                      value={acc.username}
                      onChange={(e) => handleUpdateAccount(acc.id, { username: e.target.value })}
                      placeholder={index === 0 ? "loretta" : "loretta-labs"}
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">
                      Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      value={acc.token || ''}
                      onChange={(e) => handleUpdateAccount(acc.id, { token: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-zinc-500 font-mono">
              Patty accesses repositories across both accounts to read code, write READMEs, and propose targeted patches.
            </p>
          </div>

          {/* Gemini Model Tier & Paid API */}
          <div className="space-y-3 pt-3 border-t border-rose-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
                <Gem className="w-4 h-4 text-rose-400" />
                Gemini Cognitive Model Tier
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Paid API Supported</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Flash Tier Card */}
              <div
                onClick={() => setModelTier('flash')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  modelTier === 'flash'
                    ? 'bg-rose-950/30 border-rose-600 shadow-md'
                    : 'bg-[#0a0a10] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white font-mono text-xs">Gemini 3.8 Flash</span>
                  </div>
                  {modelTier === 'flash' && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Ultra-fast response velocity. Ideal for rapid predictive chat, day-to-day workflow management, and active partnering.
                </p>
              </div>

              {/* Pro Tier Card (Paid API) */}
              <div
                onClick={() => setModelTier('pro')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  modelTier === 'pro'
                    ? 'bg-rose-950/30 border-rose-600 shadow-md'
                    : 'bg-[#0a0a10] border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Gem className="w-4 h-4 text-rose-400" />
                    <span className="font-semibold text-white font-mono text-xs">Gemini 3.1 Pro</span>
                    <span className="text-[9px] font-mono bg-rose-900/60 text-rose-200 px-1 rounded border border-rose-700/60">
                      PAID / ADVANCED
                    </span>
                  </div>
                  {modelTier === 'pro' && <Check className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Deep cognitive reasoning. Optimized for complex architectural analysis, multi-file code synthesis, and failure-mode simulation.
                </p>
              </div>
            </div>

            {/* Custom Gemini Paid API Key Field */}
            <div className="p-3.5 rounded-xl bg-[#07070b] border border-zinc-800 space-y-1.5">
              <label className="block text-zinc-300 font-mono text-[11px] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-rose-400" />
                  Custom Gemini Paid API Key (Optional)
                </span>
                <span className="text-zinc-500">Overrides environment default</span>
              </label>
              <input
                type="password"
                value={customGeminiApiKey}
                onChange={(e) => setCustomGeminiApiKey(e.target.value)}
                placeholder="AIzaSy... (leave blank to use backend configured key)"
                className="w-full px-3 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
              />
              <p className="text-[10px] text-zinc-500 font-mono">
                If you have a dedicated Gemini Paid API key, you can enter it here. It is stored securely in your browser's local storage and routed with your requests.
              </p>
            </div>
          </div>

          {/* Voice Preferences */}
          <div className="space-y-3 pt-3 border-t border-rose-950/40">
            <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
              <Volume2 className="w-4 h-4 text-rose-400" />
              Voice Synthesis & Speech
            </div>

            <label className="flex items-center gap-3 p-3 rounded-xl bg-[#0c0c14] border border-zinc-800 cursor-pointer hover:border-rose-900 transition-colors">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-4 h-4 accent-rose-600 rounded cursor-pointer"
              />
              <div className="text-xs">
                <span className="text-zinc-200 font-medium block">Auto-speak Patty's responses</span>
                <span className="text-zinc-500 text-[11px]">
                  Patty will automatically voice her direct response upon completing cognitive generation.
                </span>
              </div>
            </label>
          </div>

          {/* Local Data & Transcript */}
          <div className="space-y-3 pt-3 border-t border-rose-950/40">
            <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
              <Shield className="w-4 h-4 text-rose-400" />
              Data & Local Storage Management
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-white transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                Export Chat History (.md)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear local browser chat history for Patty? This cannot be undone.')) {
                    onClearHistory();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-900/50 text-red-300 hover:text-white transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                Clear Local Chat History
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-rose-950/40">
            <span className="text-[11px] font-mono text-emerald-400">
              {savedNotice ? '✓ Configuration saved.' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md glow-rose-sm cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
