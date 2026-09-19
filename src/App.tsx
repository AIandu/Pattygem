import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { RepoSelectorModal } from './components/RepoSelectorModal';
import { RepoInspectorModal } from './components/RepoInspectorModal';
import { GovernanceModal } from './components/GovernanceModal';
import { ScenarioSimulatorModal } from './components/ScenarioSimulatorModal';
import { SettingsModal } from './components/SettingsModal';
import { UploadsDrawer } from './components/UploadsDrawer';
import { TodoBoardModal } from './components/TodoBoardModal';
import { useSpeech } from './hooks/useSpeech';
import {
  PattyMessage,
  GitHubRepo,
  UserPreferences,
  GovernanceState,
  UploadFileItem,
  TodoProjectItem,
} from './types';
import {
  loadSavedMessages,
  saveMessages,
  loadPreferences,
  savePreferences,
  loadGovernanceState,
  saveGovernanceState,
  loadUploads,
  saveUploads,
  loadTodos,
  saveTodos,
  clearMessages,
  INITIAL_MESSAGES,
} from './services/storage';
import {
  Sparkles,
  BrainCircuit,
  Shield,
  FolderGit2,
  AlertTriangle,
  FolderKanban,
  Folder,
  Trash2,
} from 'lucide-react';

export default function App() {
  const [messages, setMessages] = useState<PattyMessage[]>(loadSavedMessages);
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [governanceState, setGovernanceState] = useState<GovernanceState>(loadGovernanceState);
  const [uploads, setUploads] = useState<UploadFileItem[]>(loadUploads);
  const [todos, setTodos] = useState<TodoProjectItem[]>(loadTodos);

  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [activeRepo, setActiveRepo] = useState<GitHubRepo | null>(preferences.selectedRepo);
  const [inspectorRepo, setInspectorRepo] = useState<GitHubRepo | null>(null);
  const [activeAccountFilter, setActiveAccountFilter] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(false);
  const [isReposLoading, setIsReposLoading] = useState(false);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);

  // Modals & Drawers state
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
  const [isRepoInspectorOpen, setIsRepoInspectorOpen] = useState(false);
  const [isGovernanceOpen, setIsGovernanceOpen] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploadsDrawerOpen, setIsUploadsDrawerOpen] = useState(false);
  const [isTodoBoardOpen, setIsTodoBoardOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition & Synthesis Hook
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    isSupported: micSupported,
    error: micError,
    speakText,
    cancelSpeech,
    isSpeaking,
  } = useSpeech();

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Persist messages whenever they change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  // Persist preferences
  useEffect(() => {
    savePreferences({ ...preferences, selectedRepo: activeRepo });
  }, [preferences, activeRepo]);

  // Persist governance state
  useEffect(() => {
    saveGovernanceState(governanceState);
  }, [governanceState]);

  // Persist uploads
  useEffect(() => {
    saveUploads(uploads);
  }, [uploads]);

  // Persist todos
  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  // Fetch GitHub repos whenever accounts configuration changes
  useEffect(() => {
    fetchRepos();
  }, [preferences.githubAccounts, preferences.githubUsername]);

  const fetchRepos = async () => {
    setIsReposLoading(true);
    try {
      const accountsToQuery = preferences.githubAccounts && preferences.githubAccounts.length > 0
        ? preferences.githubAccounts
        : [{ id: '1', username: preferences.githubUsername || 'loretta', token: preferences.githubToken || '' }];

      let allRepos: GitHubRepo[] = [];

      for (const account of accountsToQuery) {
        if (!account.username?.trim()) continue;
        const headers: Record<string, string> = {};
        if (account.token) {
          headers['x-github-token'] = account.token;
        }
        try {
          const res = await fetch(
            `/api/github/repos?username=${encodeURIComponent(account.username.trim())}`,
            { headers }
          );
          const data = await res.json();
          if (data.repos && Array.isArray(data.repos)) {
            const tagged = data.repos.map((r: GitHubRepo) => ({
              ...r,
              accountOwner: account.username,
              accountId: account.id,
            }));
            allRepos = [...allRepos, ...tagged];
          }
        } catch (err) {
          console.warn(`Could not fetch repos for ${account.username}:`, err);
        }
      }

      setRepos(allRepos);
      if (!activeRepo && allRepos.length > 0) {
        setActiveRepo(allRepos[0]);
      }
    } catch (e) {
      console.error('Failed to fetch repositories', e);
    } finally {
      setIsReposLoading(false);
    }
  };

  const handleSendMessage = async (
    promptText: string,
    isOverride = false,
    expandDecision = false,
    fileContext: any = null
  ) => {
    if (!promptText.trim() && !fileContext) return;

    // Create user message
    const userMsg: PattyMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
      timestamp: new Date().toISOString(),
      isOverride,
      repoRef: activeRepo?.name,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    if (isOverride) {
      setGovernanceState((prev) => ({
        ...prev,
        overrideCount: prev.overrideCount + 1,
      }));
    }

    try {
      const res = await fetch('/api/patty/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          history: messages,
          activeRepo,
          fileContext,
          ownerOverride: isOverride,
          expandDecision,
          customGeminiApiKey: preferences.customGeminiApiKey,
          modelTier: preferences.modelTier || 'flash',
          accounts: preferences.accounts || [],
          allRepos: repos || [],
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server returned an error');
      }

      // If Patty detected a repository from Loretta's prompt, automatically sync activeRepo
      if (data.detectedRepo && (!activeRepo || activeRepo.name !== data.detectedRepo.name)) {
        setActiveRepo(data.detectedRepo);
      }

      const pattyMsg: PattyMessage = {
        id: `patty-${Date.now()}`,
        role: 'assistant',
        content: data.text,
        timestamp: data.timestamp || new Date().toISOString(),
        sections: data.sections,
        repoRef: (data.detectedRepo || activeRepo)?.name,
      };

      setMessages((prev) => [...prev, pattyMsg]);

      // Check if Patty should speak response
      if (preferences.autoSpeak && data.sections?.response) {
        speakText(data.sections.response);
      }
    } catch (err: any) {
      console.error('Failed to get response from Patty:', err);
      let cleanErrorMessage = err.message || 'Capacity spike on model';
      try {
        const parsed = JSON.parse(cleanErrorMessage);
        if (parsed?.error?.message) {
          cleanErrorMessage = parsed.error.message;
        }
      } catch (_) {}

      const errorMsg: PattyMessage = {
        id: `patty-err-${Date.now()}`,
        role: 'assistant',
        content: `### Directive\nMaintain cognitive continuity. ${cleanErrorMessage.includes('prepayment') ? 'Your personal Gemini paid API key can be entered in Settings for dedicated quota.' : `Cognitive twin stream experienced temporary capacity pressure (${cleanErrorMessage}). Loretta remains the sole directing authority.`}\n\n### Primary Risk\nDelaying prompt dispatch while model buffer clears.\n\n### Memory Notes\nPrompt indexed: "${promptText.slice(0, 45)}..."`,
        timestamp: new Date().toISOString(),
        sections: {
          directive: `Maintain cognitive continuity. ${cleanErrorMessage.includes('prepayment') ? 'Your personal Gemini paid API key can be entered in Settings (gear icon in header) for dedicated quota.' : `Cognitive stream experienced temporary capacity pressure (${cleanErrorMessage}). Loretta remains the sole directing authority.`}`,
          primaryRisk: `Delaying prompt dispatch while model buffer clears.`,
          memoryNotes: `Prompt indexed: "${promptText.slice(0, 45)}..."`,
          elaboration: `Telemetry diagnostic: ${cleanErrorMessage}. Loretta's override or personal paid Gemini API key configured in Settings guarantees dedicated capacity.`,
        },
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandDecision = (msgId: string) => {
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg) return;

    const directiveText = targetMsg.sections?.directive || targetMsg.content;
    const prompt = `Loretta requests architectural elaboration on your directive: "${directiveText}". Detail the multi-step execution path, edge-case failure modes, and trade-offs for my approval.`;
    handleSendMessage(prompt, false, true);
  };

  const handleActionOnRepo = (
    repo: GitHubRepo,
    action: 'assess' | 'readme' | 'minor_fix' | 'inspect'
  ) => {
    setActiveRepo(repo);

    if (action === 'inspect') {
      setInspectorRepo(repo);
      setIsRepoInspectorOpen(true);
      return;
    }

    if (action === 'assess') {
      handleSendMessage(
        `Assess repository "${repo.name}". Read its architectural footprint, predict future bottlenecks, and deliver your direct response, prediction, and decision ready for my approval.`
      );
    } else if (action === 'readme') {
      handleSendMessage(
        `Write a production-grade, comprehensive README.md for "${repo.name}" with architecture diagrams, quickstart, technical decisions, and setup instructions.`
      );
    } else if (action === 'minor_fix') {
      handleSendMessage(
        `Inspect repository "${repo.name}" and suggest minor code fixes, configuration patches, or performance improvements.`
      );
    }
  };

  const handleAnalyzeFile = (repo: GitHubRepo, filePath: string, fileContent: string) => {
    setActiveRepo(repo);
    handleSendMessage(
      `Please analyze file "${filePath}" in repository "${repo.name}". Audit for potential race conditions, bugs, and performance bottlenecks, and propose an exact surgical fix diff:`,
      false,
      false,
      {
        path: filePath,
        content: fileContent,
      }
    );
  };

  const handleRunSimulation = (scenarioTitle: string, scenarioPrompt: string) => {
    handleSendMessage(
      `[COGNITIVE PROBLEM-SOLVING SIMULATION: ${scenarioTitle}]\n${scenarioPrompt}\nSimulate this scenario across our system architecture and provide your direct Response, Prediction, and Decision.`
    );
  };

  const handleClearChat = () => {
    clearMessages();
    setMessages(INITIAL_MESSAGES);
    cancelSpeech();
  };

  // Upload handler from ChatComposer
  const handleUploadFile = (fileItem: UploadFileItem) => {
    setUploads((prev) => [fileItem, ...prev]);
  };

  // Delete upload handler
  const handleDeleteUpload = (id: string) => {
    setUploads((prev) => prev.filter((u) => u.id !== id));
  };

  // Clear all uploads
  const handleClearAllUploads = () => {
    setUploads([]);
  };

  // Filtered repos by active account tab
  const filteredRepos = repos.filter((r) => {
    if (activeAccountFilter === 'all') return true;
    return (r as any).accountId === activeAccountFilter;
  });

  const pendingTodosCount = todos.filter((t) => t.status === 'approval_needed').length;

  return (
    <div className="min-h-screen bg-[#000000] text-pink-100 flex flex-col font-mono selection:bg-pink-500/30 selection:text-pink-200 relative overflow-x-hidden">
      {/* Top Command Center Header with AI&U Banner */}
      <Header
        activeRepo={activeRepo}
        repoCount={repos.length}
        governanceState={governanceState}
        accounts={preferences.githubAccounts || []}
        activeAccountFilter={activeAccountFilter}
        onSelectAccountFilter={setActiveAccountFilter}
        modelTier={preferences.modelTier || 'flash'}
        onToggleModelTier={() => {
          const nextTier = preferences.modelTier === 'pro' ? 'flash' : 'pro';
          setPreferences((prev) => ({ ...prev, modelTier: nextTier }));
        }}
        onOpenRepoSelector={() => setIsRepoSelectorOpen(true)}
        onTriggerOverride={() => {
          handleSendMessage(
            'Halt current assumptions. I am commanding an immediate owner override: ',
            true
          );
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenGovernance={() => setIsGovernanceOpen(true)}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onClearHistory={handleClearChat}
        isSpeaking={isSpeaking}
        onToggleSpeech={() => {
          if (isSpeaking) {
            cancelSpeech();
          }
          setPreferences((prev) => ({ ...prev, autoSpeak: !prev.autoSpeak }));
        }}
        autoSpeak={preferences.autoSpeak}
        onOpenTodoBoard={() => setIsTodoBoardOpen(true)}
        onOpenUploadsFolder={() => setIsUploadsDrawerOpen(true)}
        uploadsCount={uploads.length}
        pendingTodosCount={pendingTodosCount}
      />

      {/* Main Conversation Stream - Scrolling text behind centered composer, hides/fades when Loretta is composing */}
      <main
        className={`flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 pt-4 pb-48 flex flex-col justify-between transition-all duration-300 ${
          isComposerFocused ? 'opacity-35 blur-[0.4px]' : 'opacity-100'
        }`}
      >
        <div className="space-y-4">
          {/* Welcome / Partner Hero Banner if only 1 initial message */}
          {messages.length <= 1 && (
            <div className="rounded-2xl bg-[#09040b] border border-pink-500/30 p-5 sm:p-7 text-center space-y-4 shadow-xl">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-pink-950/70 border border-pink-400/50 p-1">
                <img
                  src="/patty_avatar.jpg"
                  alt="Patty"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-mono">
                  PATTY // Cognitive Twin Mind
                </h2>
                <p className="text-xs sm:text-sm text-pink-200/80 max-w-xl mx-auto font-mono leading-relaxed">
                  Engineered exclusively for Loretta. Anticipating workflow friction, predicting outcomes, and governing 160+ GitHub projects with zero fabrication.
                </p>
              </div>

              {/* Quick Action Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono">
                <button
                  onClick={() => setIsRepoSelectorOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#140a16] border border-pink-500/40 hover:border-pink-300 text-pink-200 cursor-pointer"
                >
                  <FolderGit2 className="w-3.5 h-3.5 text-pink-400" />
                  <span>160+ GitHub Projects</span>
                </button>
                <button
                  onClick={() => setIsTodoBoardOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#140a16] border border-pink-500/40 hover:border-pink-300 text-pink-200 cursor-pointer"
                >
                  <FolderKanban className="w-3.5 h-3.5 text-pink-400" />
                  <span>To-Do Board</span>
                </button>
                <button
                  onClick={() => setIsGovernanceOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#140a16] border border-pink-500/40 hover:border-pink-300 text-pink-200 cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-pink-400" />
                  <span>Loretta Sole Authority</span>
                </button>
              </div>
            </div>
          )}

          {/* Render All Chat Messages with older conversations faded in background */}
          {messages.map((message, index) => {
            const isRecent = index >= messages.length - 2;
            const isFocal = isRecent || focusedMessageId === message.id;

            return (
              <div
                key={message.id}
                onClick={() => setFocusedMessageId(message.id)}
                onTouchStart={() => setFocusedMessageId(message.id)}
                onMouseEnter={() => {
                  if (focusedMessageId !== message.id) {
                    setFocusedMessageId(message.id);
                  }
                }}
                className={`transition-all duration-300 ${
                  isFocal
                    ? 'opacity-100 filter-none scale-100'
                    : 'opacity-25 hover:opacity-100 blur-[0.25px] hover:blur-none cursor-pointer'
                }`}
              >
                <ChatMessage
                  message={message}
                  onExpandDecision={handleExpandDecision}
                  onSpeak={speakText}
                />
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="my-6 px-2">
              <div className="max-w-3xl mx-auto rounded-2xl bg-[#120813] border border-pink-400/40 p-5 space-y-3 shadow-2xl">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/patty_avatar.jpg"
                    alt="Patty"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                    className="w-6 h-6 rounded-full border border-pink-400/50 object-cover"
                  />
                  <span className="text-xs font-mono font-semibold text-pink-200">
                    PATTY // Synthesizing Predictive Reasoning for Loretta...
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="h-2.5 bg-pink-950/60 rounded-full w-3/4 animate-pulse" />
                  <div className="h-2.5 bg-zinc-900 rounded-full w-5/6 animate-pulse" />
                  <div className="h-2.5 bg-zinc-900 rounded-full w-1/2 animate-pulse" />
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono text-pink-300/70 pt-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-pink-400 animate-ping" />
                  <span>Predicting outcomes & calculating single primary risk...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Persistent Bottom-Left Uploads Folder Button (Requested: Folder for uploads bottom left with delete button) */}
      <div className="fixed bottom-4 left-4 z-40">
        <button
          id="uploads-folder-floating-btn"
          onClick={() => setIsUploadsDrawerOpen(true)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#140817] hover:bg-[#200e25] border border-pink-500/50 text-pink-200 shadow-xl backdrop-blur-md transition-all cursor-pointer group"
          title="Open Loretta's Uploads Folder"
        >
          <div className="relative">
            <Folder className="w-5 h-5 text-pink-400 group-hover:scale-110 transition-transform" />
            {uploads.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.2 rounded-full bg-pink-500 text-[9px] font-bold text-black">
                {uploads.length}
              </span>
            )}
          </div>
          <span className="text-xs font-mono font-semibold hidden sm:inline">
            Uploads Folder
          </span>
        </button>
      </div>

      {/* Centered Persistent Chat Composer */}
      <ChatComposer
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        activeRepo={activeRepo}
        onOpenRepoSelector={() => setIsRepoSelectorOpen(true)}
        isListening={isListening}
        transcript={transcript}
        onStartListening={startListening}
        onStopListening={stopListening}
        micSupported={micSupported}
        micError={micError}
        onUploadFile={handleUploadFile}
        onFocusChange={setIsComposerFocused}
        onOpenUploads={() => setIsUploadsDrawerOpen(true)}
      />

      {/* Expandable/Collapsible To-Do Board Modal */}
      <TodoBoardModal
        isOpen={isTodoBoardOpen}
        onClose={() => setIsTodoBoardOpen(false)}
        todos={todos}
        onUpdateTodos={(updated) => setTodos(updated)}
        onSendToPatty={(prompt) => handleSendMessage(prompt)}
      />

      {/* Bottom-Left Uploads Drawer */}
      <UploadsDrawer
        isOpen={isUploadsDrawerOpen}
        onClose={() => setIsUploadsDrawerOpen(false)}
        uploads={uploads}
        onDeleteUpload={handleDeleteUpload}
        onClearAllUploads={handleClearAllUploads}
        onSendFileToPatty={(file) => {
          handleSendMessage(
            `Loretta submitted file "${file.name}" (${file.type || 'text'}) from Uploads folder. Audit and provide Directive, Prediction, and Primary Risk:`,
            false,
            false,
            {
              path: file.name,
              content: file.content,
            }
          );
          setIsUploadsDrawerOpen(false);
        }}
      />

      {/* GitHub Repository Selector Modal */}
      <RepoSelectorModal
        isOpen={isRepoSelectorOpen}
        onClose={() => setIsRepoSelectorOpen(false)}
        repos={filteredRepos}
        activeRepo={activeRepo}
        onSelectRepo={(r) => setActiveRepo(r)}
        onActionOnRepo={handleActionOnRepo}
        githubUsername={preferences.githubUsername}
        githubToken={preferences.githubToken || ''}
        onUpdateGithubConfig={(u, t) => {
          setPreferences((prev) => ({ ...prev, githubUsername: u, githubToken: t }));
        }}
        onRefreshRepos={fetchRepos}
        isLoading={isReposLoading}
      />

      {/* Repository Inspector Modal */}
      <RepoInspectorModal
        isOpen={isRepoInspectorOpen}
        onClose={() => setIsRepoInspectorOpen(false)}
        repo={inspectorRepo}
        onAnalyzeFile={handleAnalyzeFile}
        onGenerateReadme={(r) => handleActionOnRepo(r, 'readme')}
        onAssessImprovements={(r) => handleActionOnRepo(r, 'assess')}
      />

      {/* Governance & Loretta Sole Authority Modal */}
      <GovernanceModal
        isOpen={isGovernanceOpen}
        onClose={() => setIsGovernanceOpen(false)}
        governanceState={governanceState}
        onTriggerImmediateOverride={() => {
          handleSendMessage(
            'Halt current assumptions. I am commanding an immediate owner override: ',
            true
          );
        }}
      />

      {/* Scenario Simulator Modal */}
      <ScenarioSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        activeRepo={activeRepo}
        onRunSimulation={handleRunSimulation}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        preferences={preferences}
        onSavePreferences={(newPrefs) => setPreferences(newPrefs)}
        messages={messages}
        onClearHistory={handleClearChat}
      />
    </div>
  );
}

