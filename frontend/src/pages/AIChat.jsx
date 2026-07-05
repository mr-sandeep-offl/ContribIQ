import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import axiosInstance from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';
import {
  Send,
  Trash2,
  BrainCircuit,
  User,
  Loader2,
  AlertCircle,
  ChevronDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What is my project status?',
  'Which tasks are pending?',
  'Who contributed the most?',
  'Why is my project delayed?',
  'What should I work on next?',
  'Summarize my project progress.',
];

const STORAGE_KEY_PREFIX = 'syncscore_chat_';

// Render a single message text with simple markdown-like formatting
const MessageText = ({ text }) => {
  const lines = text.split('\n');
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-2" />;

        // Detect list items starting with "- " or "• "
        const isListItem = /^(\s*[-•]\s)/.test(line);
        // Detect numbered list items "1. " or "2. " etc.
        const isNumberedItem = /^\s*\d+\.\s/.test(line);

        // Bold text: **text** → <strong>
        const renderInline = (str) => {
          const parts = str.split(/\*\*(.*?)\*\*/g);
          return parts.map((part, j) =>
            j % 2 === 1 ? <strong key={j} className="font-semibold text-white">{part}</strong> : part
          );
        };

        if (isListItem) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 mt-0.5 text-indigo-400">•</span>
              <span>{renderInline(line.replace(/^\s*[-•]\s/, ''))}</span>
            </div>
          );
        }

        if (isNumberedItem) {
          const match = line.match(/^(\s*\d+\.\s)(.*)/);
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="shrink-0 text-indigo-400 font-medium">{match[1].trim()}</span>
              <span>{renderInline(match[2])}</span>
            </div>
          );
        }

        return <div key={i}>{renderInline(line)}</div>;
      })}
    </div>
  );
};

const AIChat = () => {
  const { user } = useAuth();
  const storageKey = user ? `${STORAGE_KEY_PREFIX}${user._id}` : null;

  const getInitialMessages = useCallback(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          // Restore timestamps as Date objects
          return parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      } catch {
        // ignore parse errors
      }
    }
    return [
      {
        id: 'welcome',
        sender: 'ai',
        text: `👋 Hi${user ? ` ${user.name}` : ''}! I'm your **SyncScore AI Assistant**.\n\nI have access to your projects, tasks, contributions, and team data. Ask me anything about your workspace!\n\nTry one of the suggested questions below to get started.`,
        timestamp: new Date(),
      },
    ];
  }, [storageKey, user]);

  const [messages, setMessages] = useState(getInitialMessages);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const projectPickerRef = useRef(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    if (storageKey && messages.length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [messages, storageKey]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Fetch user's projects for the project selector
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const { data } = await axiosInstance.get('/projects');
        setProjects(data || []);
      } catch {
        // Non-critical: project picker is optional
      }
    };
    if (user) fetchProjects();
  }, [user]);

  // Close project picker on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (projectPickerRef.current && !projectPickerRef.current.contains(e.target)) {
        setShowProjectPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendMessage = async (text) => {
    const trimmed = (text ?? input).trim();
    if (!trimmed || loading) return;

    setError('');
    setInput('');
    setShowProjectPicker(false);

    const userMsg = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const payload = { message: trimmed };
      if (selectedProjectId) payload.projectId = selectedProjectId;

      const { data } = await axiosInstance.post('/ai/chat', payload);
      const reply = data.reply || 'I received your message but had no specific response.';

      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          sender: 'ai',
          text: reply,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: `e_${Date.now()}`,
          sender: 'ai',
          text: `Sorry, I encountered an error: ${errMsg}`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    const fresh = [
      {
        id: 'welcome_fresh',
        sender: 'ai',
        text: `Chat cleared! How can I help you, ${user?.name || 'there'}?\n\nFeel free to ask me about your projects, tasks, contributors, or deadlines.`,
        timestamp: new Date(),
      },
    ];
    setMessages(fresh);
    setError('');
    setInput('');
    if (storageKey) {
      try { localStorage.setItem(storageKey, JSON.stringify(fresh)); } catch { /* */ }
    }
  };

  const selectedProjectName = selectedProjectId
    ? projects.find(p => p._id === selectedProjectId)?.title || 'Project'
    : null;

  const showSuggestions = messages.length <= 1 && !loading;

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">

          {/* ── Header ── */}
          <div className="flex items-center justify-between px-6 py-3.5 border-b border-gray-800 bg-gray-900/60 backdrop-blur-sm shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <BrainCircuit size={18} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-white leading-tight">AI Assistant</h1>
                <p className="text-[11px] text-gray-500 leading-tight">
                  {selectedProjectName
                    ? `Focused on: ${selectedProjectName}`
                    : 'Workspace-wide intelligence'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Project Selector */}
              {projects.length > 0 && (
                <div className="relative" ref={projectPickerRef}>
                  <button
                    onClick={() => setShowProjectPicker(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 transition-all"
                  >
                    <Sparkles size={12} className="text-indigo-400" />
                    {selectedProjectName || 'All Projects'}
                    <ChevronDown size={12} className={`transition-transform ${showProjectPicker ? 'rotate-180' : ''}`} />
                  </button>

                  {showProjectPicker && (
                    <div className="absolute right-0 top-full mt-1.5 w-56 rounded-xl border border-gray-800 bg-gray-900/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden">
                      <div className="p-1">
                        <button
                          onClick={() => { setSelectedProjectId(''); setShowProjectPicker(false); }}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${!selectedProjectId ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                          All Projects (Workspace)
                        </button>
                        {projects.map(p => (
                          <button
                            key={p._id}
                            onClick={() => { setSelectedProjectId(p._id); setShowProjectPicker(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-all truncate ${selectedProjectId === p._id ? 'bg-indigo-600/20 text-indigo-300' : 'text-gray-300 hover:bg-gray-800'}`}
                          >
                            {p.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Clear Chat */}
              <button
                onClick={clearChat}
                title="Clear chat"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-800/30 transition-all"
              >
                <Trash2 size={12} />
                Clear
              </button>
            </div>
          </div>

          {/* ── Messages ── */}
          <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
            <div className="max-w-3xl mx-auto w-full space-y-4">

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : msg.isError
                        ? 'bg-rose-900/40 border border-rose-700/40 text-rose-400'
                        : 'bg-gray-800 border border-gray-700 text-indigo-400'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <User size={13} />
                    ) : msg.isError ? (
                      <AlertCircle size={13} />
                    ) : (
                      <BrainCircuit size={13} />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : msg.isError
                        ? 'bg-rose-950/30 border border-rose-800/30 text-rose-300 rounded-tl-sm'
                        : 'bg-gray-800/70 border border-gray-700/40 text-gray-200 rounded-tl-sm'
                    }`}
                  >
                    {msg.sender === 'user' ? (
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    ) : (
                      <MessageText text={msg.text} />
                    )}
                    <p className={`text-[10px] mt-1.5 select-none ${msg.sender === 'user' ? 'text-indigo-300' : 'text-gray-600'}`}>
                      {msg.timestamp instanceof Date
                        ? msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing / Loading indicator */}
              {loading && (
                <div className="flex gap-3 flex-row">
                  <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mt-0.5">
                    <BrainCircuit size={13} className="text-indigo-400" />
                  </div>
                  <div className="bg-gray-800/70 border border-gray-700/40 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2.5">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs text-gray-500">AI is thinking...</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* ── Suggested Prompts ── */}
          {showSuggestions && (
            <div className="shrink-0 px-4 pb-3">
              <div className="max-w-3xl mx-auto">
                <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider font-medium">Suggested questions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      disabled={loading}
                      className="px-3 py-1.5 rounded-full bg-gray-800/80 border border-gray-700 hover:border-indigo-500/50 hover:bg-indigo-600/10 hover:text-indigo-300 text-gray-400 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Error Banner ── */}
          {error && (
            <div className="shrink-0 px-4 pb-2">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/30 border border-rose-800/30 text-rose-400 text-xs">
                  <AlertCircle size={13} />
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="ml-auto hover:text-rose-300">
                    <RefreshCw size={12} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Input Area ── */}
          <div className="shrink-0 px-4 py-4 border-t border-gray-800 bg-gray-900/40">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2.5 items-end">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your projects, tasks, or team..."
                  disabled={loading}
                  className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50 min-h-[46px] max-h-36 overflow-y-auto leading-relaxed"
                  style={{ fieldSizing: 'content' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  title="Send message (Enter)"
                  className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0 shadow-lg shadow-indigo-900/30"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <Send size={15} className="text-white" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-gray-600 mt-2 text-center select-none">
                Press{' '}
                <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500 font-mono text-[9px]">Enter</kbd>
                {' '}to send ·{' '}
                <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500 font-mono text-[9px]">Shift+Enter</kbd>
                {' '}for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIChat;
