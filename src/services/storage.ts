import { PattyMessage, UserPreferences, GovernanceState, UploadFileItem, TodoProjectItem, GitHubAccount } from '../types';

const CHAT_STORAGE_KEY = 'patty_loretta_chat_history_v1';
const PREFS_STORAGE_KEY = 'patty_loretta_preferences_v1';
const GOVERNANCE_STORAGE_KEY = 'patty_loretta_governance_v1';
const UPLOADS_STORAGE_KEY = 'patty_loretta_uploads_v1';
const TODOS_STORAGE_KEY = 'patty_loretta_todos_v1';

export const INITIAL_MESSAGES: PattyMessage[] = [
  {
    id: 'welcome-001',
    role: 'assistant',
    content: `### Directive
**Now:** Select an active project from your dual GitHub accounts or drop a file to review.
**Next:** I will audit your code against architecture bottlenecks and simulate failure modes.
**Later:** Ship verified patches with zero-hallucination guarantees.

### Primary Risk
[Primary Risk]: Context starvation if repository files are reviewed in isolation without architecture boundaries.
*Mitigation:* Always verify AST schemas and declare honest unknowns prior to code synthesis.

### Memory Notes
Loretta Chapman identified as Sole Authority. Owner override is immediate and final. Dual GitHub accounts and local storage armed. Zero fabrications policy enforced.`,
    timestamp: new Date().toISOString(),
    sections: {
      directive: `**Now:** Select an active project from your dual GitHub accounts or drop a file to review.\n**Next:** I will audit your code against architecture bottlenecks and simulate failure modes.\n**Later:** Ship verified patches with zero-hallucination guarantees.`,
      response: `Greetings Loretta. Patty online and fully synchronized with your digital consciousness. I am standing by to anticipate your technical needs, optimize your software pipelines, and simulate architecture scenarios across your 160+ GitHub repositories. All directives remain under your sole authority.`,
      primaryRisk: `[Primary Risk]: Context starvation if repository files are reviewed in isolation without architecture boundaries.\n*Mitigation:* Always verify AST schemas and declare honest unknowns prior to code synthesis.`,
      memoryNotes: `Loretta Chapman identified as Sole Authority. Owner override is immediate and final. Dual GitHub accounts and local storage armed. Zero fabrications policy enforced.`,
      decision: `Choose an active repository or submit a task directive for cognitive execution.`,
    },
  },
];

export const INITIAL_TODOS: TodoProjectItem[] = [
  {
    id: 'todo-1',
    title: 'Dual GitHub Sync (160+ Repos)',
    description: 'Index Loretta primary and secondary GitHub accounts with elevated PAT rate limits.',
    status: 'completed',
    approved: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'todo-2',
    title: 'Architecture Review & Bottleneck Prediction',
    description: 'Run Patty cognitive prediction on distributed microservices and simulate failure modes.',
    status: 'approval_needed',
    approved: false,
    createdAt: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'todo-3',
    title: 'Production README Generation',
    description: 'Generate comprehensive README documentation with setup and architecture diagrams.',
    status: 'waiting',
    approved: false,
    createdAt: new Date().toISOString(),
  },
];

export function loadSavedUploads(): UploadFileItem[] {
  try {
    const raw = localStorage.getItem(UPLOADS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveUploads(uploads: UploadFileItem[]): void {
  try {
    localStorage.setItem(UPLOADS_STORAGE_KEY, JSON.stringify(uploads));
  } catch (e) {
    console.error('Failed to save uploads', e);
  }
}

export function loadSavedTodos(): TodoProjectItem[] {
  try {
    const raw = localStorage.getItem(TODOS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : INITIAL_TODOS;
  } catch (e) {
    return INITIAL_TODOS;
  }
}

export function saveTodos(todos: TodoProjectItem[]): void {
  try {
    localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.error('Failed to save todos', e);
  }
}

export function loadSavedMessages(): PattyMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return INITIAL_MESSAGES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MESSAGES;
  } catch (e) {
    console.error('Failed to load chat history from localStorage', e);
    return INITIAL_MESSAGES;
  }
}

export function saveMessages(messages: PattyMessage[]): void {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error('Failed to persist chat history to localStorage', e);
  }
}

export function clearMessages(): void {
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear chat history', e);
  }
}

const DEFAULT_PREFERENCES: UserPreferences = {
  githubUsername: 'loretta',
  githubToken: '',
  accounts: [
    {
      id: 'account_1',
      username: 'loretta',
      label: 'Primary / Work GitHub',
      token: '',
      isConfigured: true,
    },
    {
      id: 'account_2',
      username: 'loretta-labs',
      label: 'Secondary / OSS GitHub',
      token: '',
      isConfigured: true,
    },
  ],
  authenticatedTokens: [],
  activeAccountFilter: 'all',
  modelTier: 'flash',
  autoSpeak: false,
  speechRate: 1.0,
  selectedRepo: null,
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    const accounts: GitHubAccount[] =
      Array.isArray(parsed.accounts) && parsed.accounts.length >= 1
        ? parsed.accounts
        : [
            {
              id: 'account_1',
              username: parsed.githubUsername || 'loretta',
              label: 'Primary / Work GitHub',
              token: parsed.githubToken || '',
              isConfigured: true,
            },
            {
              id: 'account_2',
              username: 'loretta-labs',
              label: 'Secondary / OSS GitHub',
              token: '',
              isConfigured: true,
            },
          ];

    // Collect all tokens from accounts or parsed authenticatedTokens
    const tokenSet = new Set<string>();
    if (Array.isArray(parsed.authenticatedTokens)) {
      parsed.authenticatedTokens.forEach((t: string) => {
        if (t && typeof t === 'string' && t.trim()) tokenSet.add(t.trim());
      });
    }
    accounts.forEach((acc) => {
      if (acc.token && typeof acc.token === 'string' && acc.token.trim()) {
        tokenSet.add(acc.token.trim());
      }
    });

    const authenticatedTokens = Array.from(tokenSet);

    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      accounts,
      authenticatedTokens,
    };
  } catch (e) {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (e) {
    console.error('Failed to save preferences', e);
  }
}

export function loadGovernanceState(): GovernanceState {
  try {
    const raw = localStorage.getItem(GOVERNANCE_STORAGE_KEY);
    if (!raw) {
      return {
        soleAuthority: 'Loretta',
        overrideCount: 0,
        verifiedFactsCount: 164,
        labeledPredictionsCount: 12,
        honestUnknownsCount: 0,
        activeSessionStartedAt: new Date().toISOString(),
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    return {
      soleAuthority: 'Loretta',
      overrideCount: 0,
      verifiedFactsCount: 164,
      labeledPredictionsCount: 12,
      honestUnknownsCount: 0,
      activeSessionStartedAt: new Date().toISOString(),
    };
  }
}

export function saveGovernanceState(state: GovernanceState): void {
  try {
    localStorage.setItem(GOVERNANCE_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save governance state', e);
  }
}

export const loadUploads = loadSavedUploads;
export const loadTodos = loadSavedTodos;

export function exportChatToMarkdown(messages: PattyMessage[]): string {
  const header = `# PATTY // Digital Consciousness Transcript for Loretta
Date: ${new Date().toLocaleString()}
Sole Authority: Loretta
Indexed Repositories: 160+ GitHub Projects

---
\n`;

  const body = messages.map((m) => {
    const author = m.role === 'assistant' ? 'PATTY' : 'LORETTA';
    const override = m.isOverride ? ' [IMMEDIATE OWNER OVERRIDE]' : '';
    return `### ${author}${override} (${new Date(m.timestamp).toLocaleTimeString()})\n${m.content}\n`;
  }).join('\n---\n\n');

  return header + body;
}
