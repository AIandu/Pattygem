export interface PattyMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sections?: {
    response?: string;
    directive?: string;
    prediction?: string;
    primaryRisk?: string;
    memoryNotes?: string;
    decision?: string;
    elaboration?: string;
  };
  isOverride?: boolean;
  isExpanded?: boolean;
  repoRef?: string;
  unknownsAcknowledged?: boolean;
}

export interface UploadFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  content?: string;
  uploadedAt: string;
}

export interface TodoProjectItem {
  id: string;
  title: string;
  description?: string;
  status: 'approval_needed' | 'waiting' | 'completed';
  approved: boolean;
  repoRef?: string;
  createdAt: string;
}

export interface GitHubAccount {
  id: string;
  username: string;
  label: string;
  token?: string;
  isConfigured: boolean;
  isSecretSourced?: boolean;
}

export interface GitHubRepo {
  id: number;
  name: string;
  owner: { login: string };
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  default_branch: string;
  open_issues_count?: number;
  accountId?: string;
  accountLabel?: string;
  accountOwner?: string;
}

export interface GitTreeNode {
  path: string;
  type: string;
  size?: number;
}

export interface GovernanceState {
  soleAuthority: 'Loretta';
  overrideCount: number;
  verifiedFactsCount: number;
  labeledPredictionsCount: number;
  honestUnknownsCount: number;
  activeSessionStartedAt: string;
}

export interface UserPreferences {
  githubUsername: string;
  githubToken?: string;
  accounts: GitHubAccount[];
  githubAccounts?: GitHubAccount[];
  authenticatedTokens: string[]; // Managed list of authenticated tokens in UserPreferences
  activeAccountFilter: string; // 'all' | accountId
  modelTier: 'flash' | 'pro';
  customGeminiApiKey?: string;
  autoSpeak: boolean;
  speechRate: number;
  selectedRepo: GitHubRepo | null;
}
