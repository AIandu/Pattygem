import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Mic,
  Sparkles,
  FolderGit2,
  AlertTriangle,
  FileCode,
  CheckCircle2,
  UploadCloud,
  FileUp,
} from 'lucide-react';
import { GitHubRepo, UploadFileItem } from '../types';

interface ChatComposerProps {
  onSendMessage: (text: string, isOverride?: boolean, expandDecision?: boolean) => void;
  isLoading: boolean;
  activeRepo: GitHubRepo | null;
  onOpenRepoSelector: () => void;
  isListening: boolean;
  transcript: string;
  onStartListening: () => void;
  onStopListening: () => void;
  micSupported: boolean;
  micError: string | null;
  onFileUpload?: (file: File) => void;
  onUploadFile?: (item: UploadFileItem) => void;
  onFocusChange?: (isFocused: boolean) => void;
  onOpenUploads?: () => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  isLoading,
  activeRepo,
  onOpenRepoSelector,
  isListening,
  transcript,
  onStartListening,
  onStopListening,
  micSupported,
  micError,
  onFileUpload,
  onUploadFile,
  onFocusChange,
  onOpenUploads,
}) => {
  const [input, setInput] = useState('');
  const [isOverrideMode, setIsOverrideMode] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync speech transcript into input field
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleFocus = () => {
    setIsFocused(true);
    onFocusChange?.(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onFocusChange?.(false);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (isListening) {
      onStopListening();
    }

    onSendMessage(input.trim(), isOverrideMode);
    setInput('');
    setIsOverrideMode(false);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleQuickAction = (actionPrompt: string, override = false) => {
    if (override) {
      setIsOverrideMode(true);
      setInput(`[IMMEDIATE OWNER OVERRIDE] ${actionPrompt}`);
    } else {
      setInput(actionPrompt);
    }
    textareaRef.current?.focus();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (onFileUpload) {
        onFileUpload(file);
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const textContent = typeof event.target?.result === 'string' ? event.target.result : '';
        const item: UploadFileItem = {
          id: `upload-${Date.now()}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          content: textContent,
          uploadedAt: new Date().toISOString(),
        };
        onUploadFile?.(item);
        // Pre-fill composer with file audit prompt
        setInput((prev) =>
          prev.trim()
            ? `${prev}\n\n[Attached File: ${file.name}]`
            : `Please inspect the uploaded file "${file.name}" for architecture bottlenecks, potential race conditions, or improvements.`
        );
      };
      reader.readAsText(file);
      e.target.value = ''; // reset so same file can be chosen again
    }
  };

  return (
    <div className="w-full px-3 sm:px-4 pb-4 pt-1 z-30 transition-all duration-300">
      <div className="max-w-3xl mx-auto space-y-2">
        {/* Quick Anticipatory Suggestion Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                activeRepo
                  ? `Assess the architecture and predict failure modes for ${activeRepo.name}.`
                  : 'Assess architecture and predict bottlenecks across my 160+ repos.'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#160c14] border border-pink-500/30 hover:border-pink-400 text-pink-200 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-pink-400" />
            <span>Predict Bottlenecks</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                activeRepo
                  ? `Write a comprehensive, production-grade README for repository ${activeRepo.name} with technical decisions, setup instructions, and architecture diagrams.`
                  : 'Help me draft an elite README for our primary project.'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120811] border border-pink-500/20 hover:border-pink-400 text-pink-200/80 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
          >
            <FileCode className="w-3 h-3 text-pink-400" />
            <span>Write README</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickAction(
                activeRepo
                  ? `Inspect repository ${activeRepo.name} and propose minor code fixes or configuration improvements.`
                  : 'Analyze minor code fixes and performance optimizations for my active codebase.'
              )
            }
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#120811] border border-pink-500/20 hover:border-pink-400 text-pink-200/80 hover:text-white whitespace-nowrap transition-colors cursor-pointer"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Assess Minor Fixes</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleQuickAction('Halt current assumptions. I am changing our architectural direction: ', true)
            }
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#260f1c] border border-pink-500/50 hover:border-pink-400 text-pink-100 whitespace-nowrap transition-colors cursor-pointer font-mono"
          >
            <AlertTriangle className="w-3 h-3 text-pink-400" />
            <span>Owner Override</span>
          </button>

          {activeRepo && (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#1b0d18] border border-pink-500/30 text-[11px] font-mono text-pink-200">
              <FolderGit2 className="w-3 h-3 text-pink-400" />
              {activeRepo.name}
            </span>
          )}
        </div>

        {/* Microphone Error Banner */}
        {micError && (
          <div className="px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-800/50 text-xs text-red-300 font-mono flex items-center justify-between">
            <span>{micError}</span>
            <button
              onClick={() => onStartListening()}
              className="underline text-red-200 hover:text-white ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Listening Live Indicator */}
        {isListening && (
          <div className="px-4 py-2 rounded-xl bg-pink-950/80 border border-pink-500 text-xs text-pink-200 flex items-center justify-between animate-pulse shadow-lg shadow-pink-950/40">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-ping" />
              <span className="font-mono font-medium">Patty listening to Loretta...</span>
            </div>
            <button
              onClick={onStopListening}
              className="text-[11px] font-mono underline hover:text-white cursor-pointer"
            >
              Done speaking
            </button>
          </div>
        )}

        {/* Centered Composer Card */}
        <form
          onSubmit={handleSubmit}
          className={`relative rounded-2xl bg-[#0d0711] border transition-all shadow-2xl ${
            isOverrideMode
              ? 'border-pink-400 shadow-pink-950/60 ring-1 ring-pink-400/50'
              : isFocused
              ? 'border-pink-400/70 shadow-pink-950/40'
              : 'border-pink-500/30 hover:border-pink-500/50'
          }`}
        >
          {isOverrideMode && (
            <div className="flex items-center justify-between px-4 py-1.5 bg-[#250d1d] border-b border-pink-400/40 text-xs font-mono text-pink-100">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5 text-pink-400" />
                Active Mode: Immediate Owner Override
              </span>
              <button
                type="button"
                onClick={() => setIsOverrideMode(false)}
                className="text-[11px] text-pink-300 hover:text-white underline cursor-pointer"
              >
                Cancel Override
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 p-2.5 sm:p-3">
            {/* Working Microphone Toggle Button */}
            {micSupported && (
              <button
                type="button"
                id="mic-input-btn"
                onClick={isListening ? onStopListening : onStartListening}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                  isListening
                    ? 'bg-pink-600 text-white border-pink-300 shadow-lg shadow-pink-950/60 animate-pulse'
                    : 'bg-[#180d1a] border-pink-500/20 text-pink-300 hover:text-white hover:border-pink-400'
                }`}
                title={isListening ? 'Stop microphone' : 'Speak to Patty (Microphone)'}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".js,.ts,.tsx,.jsx,.py,.json,.md,.txt,.html,.css,.yml,.yaml,.sh,.sql,.env"
            />

            {/* Working Upload Button - Bottom Center of screen toolbar */}
            <button
              type="button"
              id="upload-file-btn"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-xl border bg-[#180d1a] border-pink-500/20 text-pink-300 hover:text-white hover:border-pink-400 transition-all cursor-pointer flex items-center justify-center"
              title="Upload code file, README, or doc to Patty (Click or drop)"
            >
              <FileUp className="w-4 h-4 text-pink-300" />
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              id="patty-chat-composer"
              rows={1}
              value={input}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isOverrideMode
                  ? 'Loretta override directive: State your immediate instruction...'
                  : activeRepo
                  ? `Consult Patty on ${activeRepo.name}... (Enter to send)`
                  : 'Expand your thinking with Patty... (Enter to send)'
              }
              className="flex-1 max-h-[180px] min-h-[44px] bg-transparent text-pink-50 placeholder-pink-300/40 text-sm md:text-[15px] resize-none focus:outline-none py-2 px-1 font-sans leading-relaxed"
            />

            {/* Active Repo Chip Button */}
            <button
              type="button"
              id="active-repo-composer-chip"
              onClick={onOpenRepoSelector}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#180d1a] border border-pink-500/25 hover:border-pink-400 text-[11px] font-mono text-pink-200/80 hover:text-white transition-colors cursor-pointer"
              title="Select or change target GitHub repository"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-pink-400" />
              <span className="truncate max-w-[100px]">
                {activeRepo ? activeRepo.name : 'All 160+'}
              </span>
            </button>

            {/* Submit Send Button */}
            <button
              type="submit"
              id="patty-send-button"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-xl border font-medium transition-all flex items-center justify-center cursor-pointer ${
                input.trim() && !isLoading
                  ? 'bg-pink-600 hover:bg-pink-500 text-white border-pink-400 shadow-md shadow-pink-950/40'
                  : 'bg-[#150a17] border-pink-500/20 text-pink-500/40 cursor-not-allowed'
              }`}
              title="Send to Patty (Enter)"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>

        {/* Bottom center upload button indicator & disclaimer */}
        <div className="flex items-center justify-between text-[10px] font-mono text-pink-300/50 px-2">
          <span>Loretta Sole Authority • Immediate Owner Override Supported</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-pink-300/80 hover:text-pink-100 transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3 h-3" />
            <span>Upload File (Center)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
