import React from 'react';
import { Folder, X, Trash2, FileCode, FileText, Send, AlertCircle } from 'lucide-react';
import { UploadFileItem } from '../types';

interface UploadsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  uploads: UploadFileItem[];
  onDeleteUpload: (id: string) => void;
  onClearAllUploads: () => void;
  onSendFileToPatty: (file: UploadFileItem) => void;
}

export const UploadsDrawer: React.FC<UploadsDrawerProps> = ({
  isOpen,
  onClose,
  uploads,
  onDeleteUpload,
  onClearAllUploads,
  onSendFileToPatty,
}) => {
  if (!isOpen) return null;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-start p-3 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#0d0710] border border-pink-400/30 shadow-2xl shadow-pink-950/40 overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#170c1a] border-b border-pink-400/20">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-pink-950/90 border border-pink-400/40 text-pink-300">
              <Folder className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-pink-100 font-mono">
                Loretta's Uploads Folder
              </h3>
              <p className="text-[10px] text-pink-300/60 font-mono">
                {uploads.length} stored {uploads.length === 1 ? 'file' : 'files'} • Bottom Left Repository
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {uploads.length > 0 && (
              <button
                onClick={onClearAllUploads}
                className="text-[11px] font-mono text-zinc-400 hover:text-red-400 px-2 py-1 rounded transition-colors cursor-pointer"
                title="Delete all uploads"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-pink-300/60 hover:text-pink-100 hover:bg-pink-950/50 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File List */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-2">
          {uploads.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-pink-400/30 mx-auto" />
              <p className="text-xs font-mono text-pink-300/70">
                Uploads folder is empty.
              </p>
              <p className="text-[11px] text-zinc-500 font-mono max-w-xs mx-auto">
                Use the working upload button at the bottom center of the screen to drop code, readmes, or project specs.
              </p>
            </div>
          ) : (
            uploads.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-xl bg-[#150918] border border-pink-400/20 hover:border-pink-400/40 transition-all flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="p-2 rounded-lg bg-pink-950/80 text-pink-300 flex-shrink-0">
                    {file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.py') ? (
                      <FileCode className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-pink-100 truncate font-mono">
                      {file.name}
                    </div>
                    <div className="text-[10px] text-pink-300/50 font-mono flex items-center gap-2 mt-0.5">
                      <span>{formatSize(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => {
                      onSendFileToPatty(file);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-950/80 hover:bg-pink-900 border border-pink-400/30 text-xs font-mono text-pink-200 hover:text-white transition-all cursor-pointer"
                    title="Send file content to Patty for cognitive inspection"
                  >
                    <Send className="w-3 h-3 text-pink-400" />
                    <span>Inspect</span>
                  </button>

                  <button
                    onClick={() => onDeleteUpload(file.id)}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete file from storage"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 bg-[#09050b] border-t border-pink-400/15 text-[10px] font-mono text-pink-300/50 flex justify-between items-center">
          <span>Files stored locally in browser storage</span>
          <button
            onClick={onClose}
            className="hover:text-pink-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
