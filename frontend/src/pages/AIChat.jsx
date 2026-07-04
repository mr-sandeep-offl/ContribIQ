import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import axiosInstance from '../api/axiosInstance';
import { Send, Trash2, BrainCircuit, User, Loader2, AlertCircle } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What is my project status?',
  'Which tasks are pending?',
  'Who contributed the most?',
  'Why is my project delayed?',
  'What should I work on next?',
  'Summarize my project progress.',
];

const AIChat = () => {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: "👋 Hello! I'm **SyncScore AI Assistant**. I can help you understand your project status, tasks, contributors, and more.\n\nTry one of the suggested prompts below, or ask me anything about your workspace!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text) => {
    const trimmed = (text || input).trim();
    if (!trimmed || loading) return;

    setError('');
    setInput('');

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: trimmed,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const { data } = await axiosInstance.post('/ai/chat', { message: trimmed });
      const reply = data.reply || 'I received your message but had no specific response.';
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: reply, timestamp: new Date() },
      ]);
    } catch (err) {
      const errMsg =
        err?.response?.data?.message || 'Something went wrong. Please try again.';
      setError(errMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: `⚠️ ${errMsg}`,
          isError: true,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: "Chat cleared! How can I help you today?",
        timestamp: new Date(),
      },
    ]);
    setError('');
    setInput('');
  };

  const formatText = (text) => {
    // Very simple markdown-like formatting
    return text
      .split('\n')
      .map((line, i) => {
        // Bold: **text**
        const parts = line.split(/\*\*(.*?)\*\*/g);
        return (
          <span key={i}>
            {parts.map((part, j) =>
              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
            )}
            <br />
          </span>
        );
      });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <BrainCircuit size={18} className="text-indigo-400" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-white">AI Assistant</h1>
                <p className="text-xs text-gray-500">Rule-based workspace intelligence</p>
              </div>
            </div>
            <button
              onClick={clearChat}
              title="Clear chat"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-800/30 transition-all"
            >
              <Trash2 size={13} />
              Clear Chat
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-5">
            <div className="max-w-3xl mx-auto w-full space-y-5">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white'
                        : msg.isError
                          ? 'bg-rose-900/40 border border-rose-700/40 text-rose-400'
                          : 'bg-gray-800 border border-gray-700 text-indigo-400'
                      }`}
                  >
                    {msg.sender === 'user' ? (
                      <User size={14} />
                    ) : msg.isError ? (
                      <AlertCircle size={14} />
                    ) : (
                      <BrainCircuit size={14} />
                    )}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.sender === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm'
                        : msg.isError
                          ? 'bg-rose-950/30 border border-rose-800/30 text-rose-300 rounded-tl-sm'
                          : 'bg-gray-800/80 border border-gray-700/50 text-gray-200 rounded-tl-sm'
                      }`}
                  >
                    {formatText(msg.text)}
                    <p className={`text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-indigo-300' : 'text-gray-600'}`}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {loading && (
                <div className="flex gap-3 flex-row">
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0 mt-1">
                    <BrainCircuit size={14} className="text-indigo-400" />
                  </div>
                  <div className="bg-gray-800/80 border border-gray-700/50 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin text-indigo-400" />
                    <span className="text-sm text-gray-400">AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* Suggested Prompts — shown only when just welcome message */}
          {messages.length <= 1 && !loading && (
            <div className="shrink-0 px-4 pb-3">
              <div className="max-w-3xl mx-auto">
                <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">Suggested questions</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-1.5 rounded-full bg-gray-800 border border-gray-700 hover:border-indigo-500/50 hover:bg-indigo-600/10 hover:text-indigo-300 text-gray-300 text-xs font-medium transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="shrink-0 px-4 py-4 border-t border-gray-800 bg-gray-900/30">
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-3 items-end">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your projects, tasks, or contributors..."
                  disabled={loading}
                  className="flex-1 resize-none bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all disabled:opacity-50 min-h-[46px] max-h-32 overflow-y-auto"
                  style={{ fieldSizing: 'content' }}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={loading || !input.trim()}
                  title="Send message"
                  className="w-11 h-11 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shrink-0"
                >
                  {loading ? (
                    <Loader2 size={16} className="animate-spin text-white" />
                  ) : (
                    <Send size={16} className="text-white" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-gray-600 mt-2 text-center">
                Press <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500 font-mono text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-500 font-mono text-[10px]">Shift+Enter</kbd> for new line
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AIChat;
