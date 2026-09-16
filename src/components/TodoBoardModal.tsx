import React, { useState } from 'react';
import {
  X,
  CheckSquare,
  Square,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  FolderKanban,
  Sparkles,
} from 'lucide-react';
import { TodoProjectItem } from '../types';

interface TodoBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
  todos: TodoProjectItem[];
  onUpdateTodos: (todos: TodoProjectItem[]) => void;
  onSendToPatty?: (prompt: string) => void;
}

export const TodoBoardModal: React.FC<TodoBoardModalProps> = ({
  isOpen,
  onClose,
  todos,
  onUpdateTodos,
  onSendToPatty,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedColumn, setSelectedColumn] = useState<'approval_needed' | 'waiting' | 'completed'>('approval_needed');
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleToggleApprove = (id: string) => {
    onUpdateTodos(
      todos.map((t) => {
        if (t.id === id) {
          const newApproved = !t.approved;
          return {
            ...t,
            approved: newApproved,
            status: newApproved ? 'completed' : 'approval_needed',
          };
        }
        return t;
      })
    );
  };

  const handleMoveStatus = (id: string, newStatus: 'approval_needed' | 'waiting' | 'completed') => {
    onUpdateTodos(
      todos.map((t) => (t.id === id ? { ...t, status: newStatus, approved: newStatus === 'completed' } : t))
    );
  };

  const handleDelete = (id: string) => {
    onUpdateTodos(todos.filter((t) => t.id !== id));
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newItem: TodoProjectItem = {
      id: `todo-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim() || undefined,
      status: selectedColumn,
      approved: selectedColumn === 'completed',
      createdAt: new Date().toISOString(),
    };

    onUpdateTodos([newItem, ...todos]);
    setNewTitle('');
    setNewDesc('');
    setIsAdding(false);
  };

  const approvalNeededItems = todos.filter((t) => t.status === 'approval_needed');
  const waitingItems = todos.filter((t) => t.status === 'waiting');
  const completedItems = todos.filter((t) => t.status === 'completed');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-[#09070c] border border-pink-500/30 shadow-2xl shadow-pink-950/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Folder Tab Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-pink-500/20 bg-[#130b15]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-pink-950/80 border border-pink-400/40 text-pink-300">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-pink-100 font-mono tracking-wide">
                  Loretta's Project & Decision Board
                </h2>
                <span className="text-[10px] font-mono bg-pink-950/70 border border-pink-500/30 text-pink-300 px-2 py-0.5 rounded-full">
                  Executive Folder View
                </span>
              </div>
              <p className="text-[11px] text-pink-300/60 font-mono">
                Three-column decision flow • Check to approve projects • Twin Mind sync
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-950/60 hover:bg-pink-900/70 border border-pink-400/35 text-xs font-mono text-pink-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Task</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-pink-950/60 text-pink-300/60 hover:text-pink-100 transition-colors cursor-pointer"
              title="Close folder"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Add Task Sub-form */}
        {isAdding && (
          <form onSubmit={handleAddTodo} className="p-4 bg-[#110913] border-b border-pink-500/20 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-mono text-pink-200 mb-1">Project / Task Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Approve microservice refactor for Loretta repos"
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070509] border border-pink-500/30 text-white font-mono text-xs focus:outline-none focus:border-pink-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-pink-200 mb-1">Initial Column</label>
                <select
                  value={selectedColumn}
                  onChange={(e) => setSelectedColumn(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#070509] border border-pink-500/30 text-white font-mono text-xs focus:outline-none focus:border-pink-400"
                >
                  <option value="approval_needed">Approval needed</option>
                  <option value="waiting">Waiting</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-pink-200 mb-1">Description / Risk Notes (Optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Key outcome or dependency detail..."
                className="w-full px-3 py-1.5 rounded-lg bg-[#070509] border border-pink-500/30 text-white font-mono text-xs focus:outline-none focus:border-pink-400"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-1 text-xs font-mono text-zinc-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-mono text-xs font-semibold shadow-md"
              >
                Add To Board
              </button>
            </div>
          </form>
        )}

        {/* 3 Columns: Approval needed / Waiting / Completed */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Column 1: Approval needed */}
          <div className="flex flex-col rounded-xl bg-[#110712] border border-rose-950/60 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-950/60">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-300 uppercase">
                <AlertCircle className="w-4 h-4 text-amber-400" />
                Approval Needed
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50">
                {approvalNeededItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[140px]">
              {approvalNeededItems.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs font-mono">
                  No projects waiting for approval.
                </div>
              ) : (
                approvalNeededItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#1a0c1a] border border-pink-400/25 space-y-2 hover:border-pink-400/45 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => handleToggleApprove(item.id)}
                        className="mt-0.5 text-pink-400 hover:text-pink-200 transition-colors cursor-pointer"
                        title="Click checkbox to approve project"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-pink-100 font-sans leading-tight">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-pink-300/70 mt-1 font-sans">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-pink-400/10 text-[10px] font-mono text-pink-300/60">
                      <button
                        onClick={() => handleToggleApprove(item.id)}
                        className="px-2 py-0.5 rounded bg-pink-950/80 text-pink-200 hover:text-white border border-pink-500/30 cursor-pointer"
                      >
                        ✓ Click To Approve
                      </button>
                      <div className="flex items-center gap-1.5">
                        {onSendToPatty && (
                          <button
                            onClick={() => onSendToPatty(`Loretta asks about project "${item.title}": Assess the risks and predict the optimal implementation strategy.`)}
                            className="p-1 hover:text-pink-200 text-pink-400"
                            title="Consult Patty on this project"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:text-red-300 text-zinc-500"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Waiting */}
          <div className="flex flex-col rounded-xl bg-[#0c0812] border border-purple-950/60 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-purple-950/60">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-purple-300 uppercase">
                <Clock className="w-4 h-4 text-purple-400" />
                Waiting
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50">
                {waitingItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[140px]">
              {waitingItems.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs font-mono">
                  No projects in waiting state.
                </div>
              ) : (
                waitingItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#150d1e] border border-purple-500/25 space-y-2 hover:border-purple-400/40 transition-all"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => handleMoveStatus(item.id, 'approval_needed')}
                        className="mt-0.5 text-purple-400 hover:text-purple-200 transition-colors cursor-pointer"
                        title="Move to approval needed"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-purple-100 font-sans leading-tight">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-purple-300/70 mt-1 font-sans">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-purple-400/10 text-[10px] font-mono text-purple-300/60">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveStatus(item.id, 'approval_needed')}
                          className="hover:text-amber-300"
                        >
                          → Need Approval
                        </button>
                        <span>•</span>
                        <button
                          onClick={() => handleMoveStatus(item.id, 'completed')}
                          className="hover:text-emerald-300"
                        >
                          → Done
                        </button>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {onSendToPatty && (
                          <button
                            onClick={() => onSendToPatty(`Review waiting task "${item.title}": predict what is blocking it and suggest next steps.`)}
                            className="p-1 hover:text-purple-200 text-purple-400"
                            title="Consult Patty"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 hover:text-red-300 text-zinc-500"
                          title="Delete task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Completed */}
          <div className="flex flex-col rounded-xl bg-[#080d0b] border border-emerald-950/60 p-3 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-950/60">
              <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-300 uppercase">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Completed
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                {completedItems.length}
              </span>
            </div>

            <div className="flex-1 space-y-2.5 overflow-y-auto min-h-[140px]">
              {completedItems.length === 0 ? (
                <div className="text-center py-6 text-zinc-600 text-xs font-mono">
                  No completed projects yet.
                </div>
              ) : (
                completedItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-[#0e1814] border border-emerald-500/20 space-y-2"
                  >
                    <div className="flex items-start gap-2.5">
                      <button
                        onClick={() => handleToggleApprove(item.id)}
                        className="mt-0.5 text-emerald-400 hover:text-emerald-200 transition-colors cursor-pointer"
                        title="Completed"
                      >
                        <CheckSquare className="w-4 h-4" />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-xs text-emerald-200 line-through opacity-85 font-sans leading-tight">
                          {item.title}
                        </div>
                        {item.description && (
                          <div className="text-[11px] text-emerald-400/60 mt-1 font-sans">
                            {item.description}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-emerald-400/10 text-[10px] font-mono text-emerald-400/60">
                      <span className="text-emerald-300/70">✓ Verified & Approved</span>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1 hover:text-red-300 text-zinc-500 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-2.5 bg-[#0e0711] border-t border-pink-500/20 flex items-center justify-between text-[11px] font-mono text-pink-300/60">
          <span>Loretta Chapman Owner Authority • Tasks sync with Patty Memory</span>
          <span>Click folder to close</span>
        </div>
      </div>
    </div>
  );
};
