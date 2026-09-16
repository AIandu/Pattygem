import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  FolderGit2,
  Star,
  GitFork,
  Sparkles,
  FileCode,
  CheckCircle2,
  RefreshCw,
  Key,
  ShieldCheck,
  Users,
  User,
  ExternalLink,
} from 'lucide-react';
import { GitHubRepo, GitHubAccount } from '../types';

interface RepoSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  repos: GitHubRepo[];
  activeRepo: GitHubRepo | null;
  onSelectRepo: (repo: GitHubRepo) => void;
  onActionOnRepo: (repo: GitHubRepo, action: 'assess' | 'readme' | 'minor_fix' | 'inspect') => void;
  accounts?: GitHubAccount[];
  activeAccountFilter?: string;
  onSelectAccountFilter?: (filter: string) => void;
  onSaveAccounts?: (accounts: GitHubAccount[]) => void;
  githubUsername?: string;
  githubToken?: string;
  onUpdateGithubConfig?: (username: string, token: string) => void;
  onRefreshRepos: () => void;
  isLoading: boolean;
}

export const RepoSelectorModal: React.FC<RepoSelectorModalProps> = ({
  isOpen,
  onClose,
  repos,
  activeRepo,
  onSelectRepo,
  onActionOnRepo,
  accounts,
  activeAccountFilter,
  onSelectAccountFilter,
  onSaveAccounts,
  onRefreshRepos,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [showConfig, setShowConfig] = useState(false);

  // Local draft accounts
  const [draftAccounts, setDraftAccounts] = useState<GitHubAccount[]>(accounts);

  // Sync draft accounts if external accounts prop updates
  React.useEffect(() => {
    setDraftAccounts(accounts);
  }, [accounts]);

  // Extract unique languages
  const languages = useMemo(() => {
    const set = new Set<string>();
    repos.forEach((r) => {
      if (r.language) set.add(r.language);
    });
    return Array.from(set).sort();
  }, [repos]);

  // Filter repos by account, search term, and language
  const filteredRepos = useMemo(() => {
    return repos.filter((r) => {
      const matchesAccount =
        activeAccountFilter === 'all' ||
        r.accountId === activeAccountFilter ||
        (activeAccountFilter === 'account_1' && (!r.accountId || r.accountId === 'account_1'));

      const matchesSearch =
        r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.owner?.login && r.owner.login.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesLang = selectedLanguage === 'all' || r.language === selectedLanguage;
      return matchesAccount && matchesSearch && matchesLang;
    });
  }, [repos, searchTerm, selectedLanguage, activeAccountFilter]);

  if (!isOpen) return null;

  const handleSaveAccounts = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAccounts(draftAccounts);
    setShowConfig(false);
    onRefreshRepos();
  };

  const handleUpdateDraft = (id: string, updates: Partial<GitHubAccount>) => {
    setDraftAccounts((prev) =>
      prev.map((acc) => (acc.id === id ? { ...acc, ...updates } : acc))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[85vh] flex flex-col rounded-2xl bg-[#09090e] border border-rose-950/60 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-950/50 bg-[#0c0910]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                Loretta's Dual GitHub Ecosystem
                <span className="text-xs font-mono text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/60">
                  {repos.length} Repositories Indexed
                </span>
              </h2>
              <p className="text-xs text-zinc-400 font-mono">
                Patty reads code, writes READMEs, assesses improvements & fixes minor issues across both accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs text-zinc-300 transition-colors cursor-pointer"
              title="Configure Dual GitHub Accounts"
            >
              <Key className="w-3.5 h-3.5 text-rose-400" />
              <span>{showConfig ? 'Hide Accounts' : 'Configure 2 GitHubs'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dual GitHub Configuration Form (Collapsible) */}
        {showConfig && (
          <form
            onSubmit={handleSaveAccounts}
            className="p-4 bg-[#0e0c14] border-b border-rose-950/40 text-xs space-y-4"
          >
            <div className="flex items-center justify-between text-rose-300 font-mono font-semibold">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400" />
                Loretta's Dual GitHub Credentials (Stored securely in local browser storage)
              </span>
              <span className="text-[11px] text-zinc-400 font-normal">
                Elevated 5,000 req/hr rate limits & private repo access
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {draftAccounts.map((acc, index) => (
                <div key={acc.id} className="p-3 rounded-xl bg-[#07070b] border border-zinc-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-rose-300 font-semibold flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-rose-400" />
                      GitHub Account #{index + 1}
                    </span>
                    <input
                      type="text"
                      value={acc.label}
                      onChange={(e) => handleUpdateDraft(acc.id, { label: e.target.value })}
                      placeholder="e.g. Primary / Work"
                      className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-zinc-300"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">Username</label>
                    <input
                      type="text"
                      value={acc.username}
                      onChange={(e) => handleUpdateDraft(acc.id, { username: e.target.value })}
                      placeholder={index === 0 ? "loretta" : "loretta-labs"}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1 font-mono text-[11px]">
                      Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      value={acc.token || ''}
                      onChange={(e) => handleUpdateDraft(acc.id, { token: e.target.value })}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0c12] border border-zinc-700 text-white focus:border-rose-600 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium cursor-pointer"
              >
                Save Both Accounts & Sync
              </button>
            </div>
          </form>
        )}

        {/* Search, Account Tabs & Language Filter Bar */}
        <div className="p-4 border-b border-rose-950/30 bg-[#07070b] space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            {/* Account Switcher Tabs */}
            <div className="flex items-center rounded-xl bg-[#0e0e14] border border-zinc-800 p-1">
              <button
                onClick={() => onSelectAccountFilter('all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  activeAccountFilter === 'all'
                    ? 'bg-rose-950/80 text-rose-200 border border-rose-800/50 font-semibold'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span>All Accounts ({repos.length})</span>
              </button>

              {accounts.map((acc) => {
                const count = repos.filter((r) => r.accountId === acc.id || r.owner?.login === acc.username).length;
                return (
                  <button
                    key={acc.id}
                    onClick={() => onSelectAccountFilter(acc.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                      activeAccountFilter === acc.id
                        ? 'bg-rose-950/80 text-rose-200 border border-rose-800/50 font-semibold'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    @{acc.username || acc.label} {count > 0 && `(${count})`}
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search across both GitHub accounts..."
                className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-[#0f0f16] border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:border-rose-600 focus:outline-none"
              />
            </div>

            <button
              onClick={onRefreshRepos}
              disabled={isLoading}
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Refresh repository cache"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-rose-400' : ''}`} />
            </button>
          </div>

          {/* Languages Row */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedLanguage('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors cursor-pointer ${
                selectedLanguage === 'all'
                  ? 'bg-rose-950/80 text-rose-200 border border-rose-700/60 font-semibold'
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
              }`}
            >
              All Tech ({repos.length})
            </button>
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer ${
                  selectedLanguage === lang
                    ? 'bg-rose-950/80 text-rose-200 border border-rose-700/60 font-semibold'
                    : 'bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-zinc-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Repositories Grid List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {filteredRepos.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 font-mono text-sm">
              No repositories match the current filters.
            </div>
          ) : (
            filteredRepos.map((repo) => {
              const isActive = activeRepo?.id === repo.id;
              return (
                <div
                  key={repo.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isActive
                      ? 'bg-rose-950/20 border-rose-600/70 shadow-lg glow-rose-sm'
                      : 'bg-[#0b0b10] border-zinc-800/80 hover:border-rose-950 hover:bg-[#0e0e16]'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center flex-wrap gap-2">
                        <span className="font-semibold text-white font-mono text-sm hover:text-rose-300">
                          {repo.name}
                        </span>

                        {/* Account Badge */}
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-900 text-rose-300 border border-rose-950/70">
                          @{repo.owner?.login || repo.accountLabel || 'loretta'}
                        </span>

                        {isActive && (
                          <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono font-bold">
                            Active Target
                          </span>
                        )}
                        {repo.language && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-zinc-300 text-[10px] font-mono border border-zinc-800">
                            {repo.language}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-zinc-400 line-clamp-2">
                        {repo.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 pt-1">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3 text-zinc-400" />
                          {repo.forks_count}
                        </span>
                        <span>Updated: {new Date(repo.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Triggers for Patty */}
                    <div className="flex items-center flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          onSelectRepo(repo);
                          onClose();
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-rose-900/60 text-rose-200 border border-rose-700/60'
                            : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700'
                        }`}
                      >
                        {isActive ? 'Current' : 'Select'}
                      </button>

                      <button
                        onClick={() => {
                          onActionOnRepo(repo, 'assess');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-xs font-mono text-rose-300 transition-colors cursor-pointer"
                        title="Patty assesses architecture and failure modes"
                      >
                        <Sparkles className="w-3 h-3 text-rose-400" />
                        Assess
                      </button>

                      <button
                        onClick={() => {
                          onActionOnRepo(repo, 'readme');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Patty drafts or updates README.md"
                      >
                        <FileCode className="w-3 h-3 text-rose-400" />
                        README
                      </button>

                      <button
                        onClick={() => {
                          onActionOnRepo(repo, 'minor_fix');
                          onClose();
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
                        title="Propose minor code fixes and patches"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Fixes
                      </button>

                      <button
                        onClick={() => {
                          onActionOnRepo(repo, 'inspect');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                        title="Inspect Code Tree"
                      >
                        Tree
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rose-950/40 bg-[#07070b] flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Dual Accounts: Loretta Sole Authority • Zero Code Fabrications</span>
          <span>Showing {filteredRepos.length} of {repos.length} Repositories</span>
        </div>
      </div>
    </div>
  );
};
