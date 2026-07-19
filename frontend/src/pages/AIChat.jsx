import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProjects } from '../api/projectApi';
import { sendAIMessage } from '../api/aiApi';
import Navbar from '../components/layout/Navbar';
import Sidebar from '../components/layout/Sidebar';
import Button from '../components/common/Button';
import { Send, Trash2, Bot, User, Sparkles, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

const SUGGESTED_PROMPTS = [
  'What is my project status?',
  'Which tasks are pending?',
  'Which tasks are overdue?',
  'Who contributed the most?',
  'Why is my project health low?',
  'What should I work on next?',
  'Summarize my projects.',
  'Which deadlines are at risk?',
];

const AIChat = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);

  // User-specific history key
  const historyKey = userId ? `syncscore_ai_chat_${userId}` : null;

  // Restore chat history from localStorage
  useEffect(() => {
    if (historyKey) {
      const savedHistory = localStorage.getItem(historyKey);
      if (savedHistory) {
        try {
          setMessages(JSON.parse(savedHistory));
        } catch (e) {
          console.error('Failed to parse chat history', e);
        }
      }
    }
  }, [historyKey]);

  // Fetch projects list
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const data = await getProjects();
        setProjects(data || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
    };
    fetchProjects();
  }, []);

  // Save chat history (keep only the latest 30 messages)
  const saveHistory = (newMessages) => {
    if (historyKey) {
      const trimmed = newMessages.slice(-30);
      localStorage.setItem(historyKey, JSON.stringify(trimmed));
    }
  };

  // Auto-scroll to bottom after each message or loading state change
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputValue]);

  // Handler to send message
  const handleSendMessage = async (textToSend) => {
    const messageText = (textToSend || inputValue).trim();
    if (!messageText || loading) return;

    setError('');
    
    // Clear textarea input
    if (!textToSend) {
      setInputValue('');
    }

    const newUserMessage = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    saveHistory(updatedMessages);

    setLoading(true);

    try {
      // Map messages history to exact backend schema: { role, content }
      const historyPayload = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendAIMessage({
        message: messageText,
        projectId: selectedProjectId || undefined,
        history: historyPayload,
      });

      if (response && response.success) {
        const newAssistantMessage = {
          role: 'assistant',
          content: response.reply,
          provider: response.provider,
          timestamp: new Date().toISOString(),
        };
        const finalMessages = [...updatedMessages, newAssistantMessage];
        setMessages(finalMessages);
        saveHistory(finalMessages);
      } else {
        throw new Error(response?.message || 'Chat request failed');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Connection error. Please try again.');
      // Restore input text so user does not lose it
      if (!textToSend) {
        setInputValue(messageText);
      }
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcut: Enter to send, Shift+Enter for new line
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Clear chat handler
  const handleClearChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Are you sure you want to clear your conversation history?')) {
      setMessages([]);
      if (historyKey) {
        localStorage.removeItem(historyKey);
      }
      setError('');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-white border-l border-slate-200">
          
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between p-4 lg:px-8 border-b border-slate-200 bg-white shadow-sm shrink-0">
            <div className="text-left">
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
                <Bot className="text-blue-600 shrink-0" size={22} />
                SyncScore AI Assistant
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Ask questions about projects, tasks, contributors, deadlines and risks.
              </p>
            </div>
            
            {/* Project Context Selector */}
            <div className="flex items-center gap-3 mt-2 sm:mt-0">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Context:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:outline-none transition-all shadow-sm"
              >
                <option value="">All Projects (Workspace)</option>
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    Project: {p.title}
                  </option>
                ))}
              </select>
              
              {/* Clear Chat */}
              <button
                onClick={handleClearChat}
                disabled={messages.length === 0}
                className="flex items-center justify-center p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50 disabled:pointer-events-none"
                title="Clear conversation"
              >
                <Trash2 size={15} />
              </button>
            </div>
          </div>

          {/* Conversation Area */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-slate-50/50 space-y-4">
            
            {/* Empty State / Welcome Screen */}
            {messages.length === 0 && (
              <div className="max-w-2xl mx-auto py-10 lg:py-16 text-center space-y-6">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center text-white shadow-md animate-bounce">
                  <Bot size={32} />
                </div>
                <div className="space-y-2">
                  <h2 className="text-lg font-bold text-slate-900">Welcome to SyncScore AI Assistant</h2>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Choose one of the suggestions below or ask any project management query to retrieve real intelligence from your workspace.
                  </p>
                </div>

                {/* Suggested Prompts Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto pt-4">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt)}
                      className="flex items-center gap-2 p-3 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-xl text-left transition-all shadow-sm group"
                    >
                      <MessageSquare size={13} className="text-slate-400 group-hover:text-blue-500" />
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Log */}
            {messages.length > 0 && (
              <div className="max-w-3xl mx-auto space-y-4 pb-4">
                {messages.map((msg, index) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={index}
                      className={`flex gap-3 max-w-[85%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                    >
                      {/* Avatar / Icon */}
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                        isUser
                          ? 'bg-gradient-to-br from-blue-600 to-sky-400 text-white font-bold text-xs'
                          : 'bg-white border border-slate-200 text-slate-700'
                      }`}>
                        {isUser ? (
                          user?.name?.charAt(0)?.toUpperCase() || <User size={14} />
                        ) : (
                          <Bot size={15} className="text-blue-600" />
                        )}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-1 text-left">
                        <div className={`p-4 rounded-2xl border text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? 'bg-blue-600 border-blue-600 text-white rounded-tr-none'
                            : 'bg-white border-slate-200 text-slate-800 rounded-tl-none'
                        }`}>
                          {msg.content}
                        </div>

                        {/* Metadata Footer */}
                        {!isUser && msg.provider && (
                          <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <Sparkles size={10} className="text-slate-400" />
                            Provider: {msg.provider}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Loading / Typing Indicator */}
                {loading && (
                  <div className="flex gap-3 max-w-[85%] mr-auto items-start">
                    <div className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm shrink-0">
                      <Bot size={15} className="text-blue-600 animate-pulse" />
                    </div>
                    <div className="p-4 rounded-2xl border border-slate-200 bg-white text-sm shadow-sm text-left rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}

                {/* Error Banner with Retry */}
                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm max-w-lg mx-auto">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <div className="flex-1 text-left">
                      <p className="font-semibold">Assistant Connection Failed</p>
                      <p className="text-xs text-red-600">{error}</p>
                    </div>
                    <button
                      onClick={() => handleSendMessage()}
                      className="text-xs font-semibold underline text-red-600 hover:text-red-700 flex items-center gap-1 shrink-0 self-center"
                    >
                      <RefreshCw size={11} />
                      Retry
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Form Input Control */}
          <div className="p-4 border-t border-slate-200 bg-white shrink-0">
            <div className="max-w-3xl mx-auto flex items-end gap-2.5">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Ask about project status, members, overdue tasks, contributions..."
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] resize-none transition-all shadow-inner max-h-[180px] min-h-[42px]"
                disabled={loading}
              />
              <Button
                variant="primary"
                onClick={() => handleSendMessage()}
                disabled={loading || !inputValue.trim()}
                className="h-[42px] w-[42px] p-0 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95"
              >
                <Send size={15} />
              </Button>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default AIChat;
