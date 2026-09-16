import React, { useState, useEffect } from 'react';
import { X, FolderGit2, FileText, ChevronRight, Sparkles, FileCode, CheckCircle2, ArrowRight } from 'lucide-react';
import { GitHubRepo, GitTreeNode } from '../types';

interface RepoInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  repo: GitHubRepo | null;
  onAnalyzeFile: (repo: GitHubRepo, filePath: string, fileContent: string) => void;
  onGenerateReadme: (repo: GitHubRepo) => void;
  onAssessImprovements: (repo: GitHubRepo) => void;
}

export const RepoInspectorModal: React.FC<RepoInspectorModalProps> = ({
  isOpen,
  onClose,
  repo,
  onAnalyzeFile,
  onGenerateReadme,
  onAssessImprovements,
}) => {
  const [tree, setTree] = useState<GitTreeNode[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFileLoading, setIsFileLoading] = useState(false);

  useEffect(() => {
    if (isOpen && repo) {
      fetchTree(repo);
    }
  }, [isOpen, repo]);

  const fetchTree = async (targetRepo: GitHubRepo) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/github/tree?owner=${targetRepo.owner.login}&repo=${targetRepo.name}`);
      const data = await res.json();
      if (data.tree) {
        setTree(data.tree);
        // Automatically load README.md or first file
        const readme = data.tree.find((f: any) => f.path.toLowerCase() === 'readme.md');
        if (readme) {
          loadFile(targetRepo, readme.path);
        } else if (data.tree.length > 0) {
          loadFile(targetRepo, data.tree[0].path);
        }
      }
    } catch (e) {
      console.error('Failed to fetch tree', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadFile = async (targetRepo: GitHubRepo, filePath: string) => {
    setSelectedFile(filePath);
    setIsFileLoading(true);
    try {
      const res = await fetch('/api/github/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: targetRepo.owner.login,
          repo: targetRepo.name,
          path: filePath,
        }),
      });
      const data = await res.json();
      setFileContent(data.content || '// Empty file');
    } catch (e) {
      setFileContent('// Failed to load file contents.');
    } finally {
      setIsFileLoading(false);
    }
  };

  if (!isOpen || !repo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[85vh] flex flex-col rounded-2xl bg-[#09090e] border border-rose-950/60 shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-rose-950/50 bg-[#0c0910]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-950/60 border border-rose-800/50 text-rose-300">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white font-['Plus_Jakarta_Sans']">
                  {repo.name}
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {repo.default_branch || 'main'}
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                {repo.description || 'Ecosystem repository'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onAssessImprovements(repo);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/50 text-xs font-mono text-rose-300 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Assess Improvements
            </button>
            <button
              onClick={() => {
                onGenerateReadme(repo);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            >
              <FileCode className="w-3.5 h-3.5 text-rose-400" />
              Generate README
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Sidebar tree + Code viewer */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* File Tree Sidebar */}
          <div className="w-full md:w-72 border-r border-rose-950/30 bg-[#07070a] overflow-y-auto p-3 space-y-1">
            <div className="text-[11px] font-mono uppercase text-zinc-500 tracking-wider px-2 py-1 font-semibold">
              Repository Files ({tree.length})
            </div>

            {isLoading ? (
              <div className="p-4 text-center text-xs font-mono text-zinc-500 animate-pulse">
                Indexing tree...
              </div>
            ) : (
              tree.map((node) => {
                const isSelected = selectedFile === node.path;
                return (
                  <button
                    key={node.path}
                    onClick={() => loadFile(repo, node.path)}
                    className={`flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-xs font-mono text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/60 text-rose-200 border border-rose-800/60 font-medium'
                        : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="truncate flex-1">{node.path}</span>
                  </button>
                );
              })
            )}
          </div>

          {/* Code Viewer & Patty Actions */}
          <div className="flex-1 flex flex-col min-h-0 bg-[#0a0a0f]">
            {/* Viewer Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900 bg-[#0e0e14] text-xs font-mono">
              <span className="text-zinc-300 font-semibold">{selectedFile || 'No file selected'}</span>
              {selectedFile && (
                <button
                  onClick={() => {
                    onAnalyzeFile(repo, selectedFile, fileContent);
                    onClose();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium cursor-pointer shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Have Patty Analyze / Fix This File
                </button>
              )}
            </div>

            {/* Code Content */}
            <div className="flex-1 overflow-auto p-4 bg-[#050508] font-mono text-xs md:text-sm text-zinc-300 leading-relaxed">
              {isFileLoading ? (
                <div className="p-8 text-center text-zinc-500 animate-pulse">
                  Retrieving file contents...
                </div>
              ) : (
                <pre className="whitespace-pre overflow-x-auto">{fileContent}</pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-2.5 border-t border-rose-950/40 bg-[#07070b] flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Non-Fabrication Policy: Patty inspects verified repository files only.</span>
          <span>Target Branch: {repo.default_branch || 'main'}</span>
        </div>
      </div>
    </div>
  );
};
