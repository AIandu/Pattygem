import React, { useState, useEffect } from 'react';
import {
  X,
  Settings,
  Key,
  Volume2,
  Download,
  Trash2,
  Shield,
  User,
  Zap,
  Gem,
  Check,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  ShieldCheck,
  Lock,
} from 'lucide-react';
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
    preferences.accounts && preferences.accounts.length >= 1
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
            username: 'loretta-labs',
            token: '',
            isConfigured: true,
          },
        ];

  const [accounts, setAccounts] = useState<GitHubAccount[]>(initialAccounts);
  const [authenticatedTokens, setAuthenticatedTokens] = useState<string[]>(
    preferences.authenticatedTokens || []
  );
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [modelTier, setModelTier] = useState<'flash' | 'pro'>(preferences.modelTier || 'flash');
  const [customGeminiApiKey, setCustomGeminiApiKey] = useState(preferences.customGeminiApiKey || '');
  const [autoSpeak, setAutoSpeak] = useState(preferences.autoSpeak || false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [isSyncingSecrets, setIsSyncingSecrets] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAccounts(preferences.accounts && preferences.accounts.length >= 1 ? preferences.accounts : initialAccounts);
      setAuthenticatedTokens(preferences.authenticatedTokens || []);
      setModelTier(preferences.modelTier || 'flash');
      setCustomGeminiApiKey(preferences.customGeminiApiKey || '');
      setAutoSpeak(preferences.autoSpeak || false);
    }
  }, [isOpen, preferences]);

  if (!isOpen) return null;

  const handleUpdateAccount = (id: string, updates: Partial<GitHubAccount>) => {
    setAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  const handleAddAccount = () => {
    const newIdx = accounts.length + 1;
    const newAcc: GitHubAccount = {
      id: `account_${Date.now()}`,
      label: `Account ${newIdx}`,
      username: '',
      token: authenticatedTokens[newIdx - 1] || '',
      isConfigured: true,
    };
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleRemoveAccount = (id: string) => {
    if (accounts.length <= 1) return;
    setAccounts((prev) => prev.filter((acc) => acc.id !== id));
  };

  const handleToggleShowToken = (id: string) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Sync with secrets from backend environment
  const handleSyncSecrets = async () => {
    setIsSyncingSecrets(true);
    setSyncStatus('Checking secrets in backend environment...');
    try {
      const res = await fetch('/api/github/secrets-status');
      const data = await res.json();
      if (data.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
        const foundTokens: string[] = data.tokens;
        // Merge with authenticatedTokens
        const tokenSet = new Set([...authenticatedTokens, ...foundTokens]);
        const updatedTokenPool = Array.from(tokenSet);
        setAuthenticatedTokens(updatedTokenPool);

        // Assign to accounts if empty
        setAccounts((prev) =>
          prev.map((acc, idx) => {
            if (!acc.token && foundTokens[idx]) {
              return { ...acc, token: foundTokens[idx], isSecretSourced: true };
            }
            return acc;
          })
        );

        setSyncStatus(`Discovered ${foundTokens.length} GitHub token secrets. Accounts updated and authenticated!`);
      } else {
        setSyncStatus('No secret tokens detected in process environment yet. You can paste PATs directly below.');
      }
    } catch (e: any) {
      setSyncStatus(`Notice: ${e.message || 'Could not query secrets'}`);
    } finally {
      setIsSyncingSecrets(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Consolidate all non-empty tokens into authenticatedTokens pool
    const tokenSet = new Set<string>(authenticatedTokens);
    accounts.forEach((acc) => {
      if (acc.token && acc.token.trim()) {
        tokenSet.add(acc.token.trim());
      }
    });
    const finalTokens = Array.from(tokenSet);

    onSavePreferences({
      ...preferences,
      accounts,
      authenticatedTokens: finalTokens,
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

  const totalTokensCount = authenticatedTokens.length;

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
                Multi-Account GitHub credentials, authenticated tokens pool, and Gemini tier
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
          {/* Multi-Account GitHub Connection & Token Pool */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
                <User className="w-4 h-4 text-rose-400" />
                Multi-Account GitHub Credentials
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncSecrets}
                  disabled={isSyncingSecrets}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-[10px] font-mono text-rose-200 transition-colors cursor-pointer"
                  title="Auto-discover tokens placed in Secrets"
                >
                  <RefreshCw className={`w-3 h-3 text-rose-300 ${isSyncingSecrets ? 'animate-spin' : ''}`} />
                  <span>Sync from Secrets</span>
                </button>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/40 text-rose-300 border border-rose-900/40">
                  {totalTokensCount > 0 ? `${totalTokensCount} Tokens in UserPreferences` : 'No Tokens Stored'}
                </span>
              </div>
            </div>

            {syncStatus && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/40 text-[11px] font-mono text-rose-200 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>{syncStatus}</span>
              </div>
            )}

            <div className="space-y-3">
              {accounts.map((acc, index) => {
                const isTokenVisible = showTokens[acc.id] || false;
                const hasToken = Boolean(acc.token && acc.token.trim());

                return (
                  <div key={acc.id} className="p-3.5 rounded-xl bg-[#07070b] border border-zinc-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-rose-300 font-semibold">
                          Account #{index + 1}
                        </span>
                        {hasToken ? (
                          <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-700/50">
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            Authenticated
                          </span>
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-700">
                            Public Unauthenticated
                          </span>
                        )}
                        {acc.isSecretSourced && (
                          <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/50">
                            <Lock className="w-2.5 h-2.5 text-rose-400" />
                            From Secrets
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={acc.label}
                          onChange={(e) => handleUpdateAccount(acc.id, { label: e.target.value })}
                          placeholder={index === 0 ? "Primary / Work" : "Secondary / OSS"}
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300 w-32 text-right"
                        />
                        {accounts.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAccount(acc.id)}
                            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                            title="Remove this account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 mb-1 font-mono text-[11px]">
                          GitHub Username / Organization
                        </label>
                        <input
                          type="text"
                          value={acc.username}
                          onChange={(e) => handleUpdateAccount(acc.id, { username: e.target.value })}
                          placeholder={index === 0 ? "loretta" : "loretta-labs"}
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-zinc-400 font-mono text-[11px]">
                            Personal Access Token (PAT)
                          </label>
                          <button
                            type="button"
                            onClick={() => handleToggleShowToken(acc.id)}
                            className="text-[10px] text-zinc-400 hover:text-zinc-200 flex items-center gap-1 font-mono"
                          >
                            {isTokenVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            <span>{isTokenVisible ? 'Hide' : 'Reveal'}</span>
                          </button>
                        </div>
                        <input
                          type={isTokenVisible ? 'text' : 'password'}
                          value={acc.token || ''}
                          onChange={(e) => handleUpdateAccount(acc.id, { token: e.target.value, isSecretSourced: false })}
                          placeholder="ghp_xxxxxxxxxxxx"
                          className="w-full px-3 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-1">
              <button
                type="button"
                onClick={handleAddAccount}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-rose-400" />
                <span>Add Another GitHub Account</span>
              </button>
              <p className="text-[11px] text-zinc-500 font-mono">
                Tokens grant elevated 5,000 req/hr limits & private repo inspection.
              </p>
            </div>
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
                    <span className="font-semibold text-white font-mono text-xs">Gemini 3 Flash</span>
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
                  High-capacity reasoning engine. Recommended for deep codebase simulation, architectural stress-testing, and complex scenarios.
                </p>
              </div>
            </div>

            {/* Custom Gemini API Key */}
            <div className="p-3.5 rounded-xl bg-[#07070b] border border-zinc-800 space-y-2">
              <label className="flex items-center justify-between text-zinc-300 font-mono">
                <span className="flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-rose-400" />
                  Custom Gemini API Key (Optional)
                </span>
                <span className="text-[10px] text-zinc-500">Overrides environment secret</span>
              </label>
              <input
                type="password"
                value={customGeminiApiKey}
                onChange={(e) => setCustomGeminiApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
              />
              <p className="text-[11px] text-zinc-500 leading-normal">
                If blank, Patty automatically uses the high-demand resilient fallback models configured in the environment.
              </p>
            </div>
          </div>

          {/* Voice Output Settings */}
          <div className="space-y-3 pt-3 border-t border-rose-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-rose-400" />
                Patty Voice Synthesizer
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#07070b] border border-zinc-800">
              <div>
                <p className="font-semibold text-white font-mono text-xs">Automatic Voice Readout</p>
                <p className="text-[11px] text-zinc-400">
                  Read out Patty's direct responses and decisions using natural browser speech synthesis.
                </p>
              </div>
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-4 h-4 accent-rose-500 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Session Data & Export */}
          <div className="space-y-3 pt-3 border-t border-rose-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-300 font-mono font-semibold uppercase tracking-wider">
                <Shield className="w-4 h-4 text-rose-400" />
                Data & Governance Controls
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer font-mono text-xs"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" />
                <span>Export Chat to Markdown (.md)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Clear chat history? Loretta Chapman remains Sole Authority.')) {
                    onClearHistory();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 hover:text-rose-100 transition-colors cursor-pointer font-mono text-xs ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Chat History</span>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-rose-950/50">
            {savedNotice ? (
              <span className="flex items-center gap-1.5 text-emerald-400 font-mono font-semibold">
                <Check className="w-4 h-4" />
                Settings Saved Successfully
              </span>
            ) : (
              <span className="text-[11px] text-zinc-500 font-mono">
                Changes persist instantly in localStorage
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium cursor-pointer shadow-lg shadow-rose-900/30"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

