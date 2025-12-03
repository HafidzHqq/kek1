import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl, API_BASE } from '../lib/api';

const Chat = ({ role = 'user', userEmail }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]); // daftar akun terdaftar (admin)
  const [activeEmail, setActiveEmail] = useState(userEmail || '');
  const [sessionId, setSessionId] = useState(() => {
    // SELALU gunakan email sebagai sessionId (format: email_xxx_at_xxx_dot_com)
    if (userEmail) {
      return `email_${userEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
    }
    // Fallback: ambil dari localStorage jika user sudah pernah login
    const savedEmail = localStorage.getItem('userEmail');
    if (savedEmail) {
      return `email_${savedEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
    }
    // Jika tidak ada email sama sekali (tidak seharusnya terjadi karena sudah ada LoginRequired)
    console.warn('Chat: No user email found, using fallback sessionId');
    return 'guest_' + Date.now();
  });
  const pollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fetchingRef = useRef(false);
  const emailRef = useRef(userEmail);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log('[Chat] Fetch already in progress, skipping');
      return;
    }
    
    fetchingRef.current = true;
    try {
      console.log('[Chat] Fetching messages for sessionId:', sessionId);
      const { data } = await axios.get(apiUrl(`/api/chat?sessionId=${sessionId}`), {
        timeout: 8000 // 8 second timeout
      });
      
      if (Array.isArray(data)) {
        console.log('[Chat] ✅ Received', data.length, 'messages');
        
        setMessages(prev => {
          // Keep temp messages that are still sending
          const tempMessages = prev.filter(m => m._tempId && m._sending);
          
          // Merge: server messages (source of truth) + temp sending messages
          const serverIds = new Set(data.map(m => m.id));
          
          // Remove temp messages that are now confirmed on server
          const validTempMessages = tempMessages.filter(m => {
            // If message has same text and timestamp as server message, remove temp
            const isDuplicate = data.some(sm => 
              sm.text === m.text && 
              Math.abs(new Date(sm.createdAt) - new Date(m.createdAt)) < 2000
            );
            return !isDuplicate;
          });
          
          const result = [...data, ...validTempMessages].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
          );
          
          console.log('[Chat] 📊 Messages:', data.length, 'from server +', validTempMessages.length, 'temp =', result.length, 'total');
          return result;
        });
        setError('');
      } else {
        console.warn('[Chat] ⚠️ Unexpected response format:', typeof data);
      }
    } catch (e) {
      console.error('[Chat] ❌ Fetch error:', e.message);
      // Don't show error on timeout - just skip this poll
      if (!e.message?.includes('timeout')) {
        setError(`Gagal memuat: ${e.message}`);
      }
    } finally {
      fetchingRef.current = false;
    }
  };

  // Admin: ambil daftar semua user
  useEffect(() => {
    const fetchUsers = async () => {
      if (role !== 'admin') return;
      try {
        const token = localStorage.getItem('authToken');
        const { data } = await axios.get(apiUrl('/api/auth/users'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (data?.success && Array.isArray(data.users)) {
          setUsers(data.users);
          // jika belum ada activeEmail, pilih pertama
          if (!activeEmail && data.users.length) {
            const firstEmail = data.users[0].email;
            setActiveEmail(firstEmail);
            setSessionId(`email_${firstEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`);
          }
        }
      } catch (e) {
        console.error('Gagal memuat daftar akun:', e);
      }
    };
    fetchUsers();
  }, [role]);

  // Ketika sessionId berubah atau komponen mount, setup polling
  useEffect(() => {
    console.log('[Chat] 🔄 SessionId changed to:', sessionId);
    setMessages([]); // Clear messages saat ganti room
    fetchingRef.current = false; // Reset fetch lock
    
    // Fetch pertama kali (immediate)
    fetchMessages();
    
    // Setup fast polling (1.5 seconds for better real-time feel)
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(fetchMessages, 1500);
    
    // Cleanup saat unmount atau sessionId berubah
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      fetchingRef.current = false;
    };
  }, [sessionId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const messageText = input.trim();
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const optimisticMessage = {
      sender: role,
      text: messageText,
      createdAt: now,
      _tempId: tempId,
      _sending: true
    };
    
    console.log('[Chat] 📤 Sending message:', messageText.substring(0, 50));
    
    // Optimistic update - langsung tampilkan di UI
    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');
    
    try {
      const { data } = await axios.post(apiUrl('/api/chat'), { 
        sender: role, 
        text: messageText, 
        sessionId 
      }, {
        timeout: 10000 // 10 second timeout for send
      });
      
      console.log('[Chat] ✅ Message sent, id:', data.id);
      
      // Remove temp message - real message will come from next poll
      setMessages(prev => prev.filter(m => m._tempId !== tempId));
      
      // Force immediate refresh to get server confirmation
      setTimeout(() => {
        fetchingRef.current = false; // Reset lock
        fetchMessages();
      }, 300);
      
      setError('');
    } catch (e) {
      console.error('[Chat] ❌ Send error:', e.message);
      setError(`Gagal mengirim: ${e.message}`);
      
      // Mark as failed
      setMessages(prev => 
        prev.map(m => m._tempId === tempId ? { ...m, _failed: true, _sending: false } : m)
      );
    }
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-gray-900 via-blue-950 to-purple-900 text-white overflow-hidden">
      {/* Sidebar untuk admin: daftar semua akun - Mobile responsive */}
      {role === 'admin' && (
        <>
          {/* Mobile overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <div className={`
            fixed lg:relative inset-y-0 left-0 z-50
            w-72 lg:w-80
            bg-gray-950 border-r border-purple-700 overflow-y-auto
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}>
          <div className="px-4 py-4 border-b border-purple-700 flex items-center justify-between">
            <div className="font-semibold">Daftar User</div>
            <div className="text-xs bg-purple-700/30 px-2 py-1 rounded-full">{users.length}</div>
          </div>
          <div>
            {users.map(u => (
              <button
                key={u.email}
                onClick={() => {
                  setActiveEmail(u.email);
                  setSessionId(`email_${u.email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`);
                  setSidebarOpen(false); // Close sidebar on mobile after select
                }}
                className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-purple-700/20 transition ${activeEmail===u.email ? 'bg-purple-700/10' : ''}`}
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <span className="font-bold">{(u.name||u.email)[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{u.name || u.email}</div>
                  <div className="text-xs text-gray-400">{u.email}</div>
                </div>
              </button>
            ))}
            {!users.length && (
              <div className="px-4 py-6 text-sm text-gray-400">Belum ada akun terdaftar.</div>
            )}
          </div>
        </div>
      )}

      {/* Area Chat */}
      <div className="flex flex-col flex-1 min-w-0">
      <div className="py-3 px-4 md:py-4 md:px-6 bg-gray-950 border-b border-purple-700 flex items-center justify-between safe-top">
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          {/* Mobile menu button for admin */}
          {role === 'admin' && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-purple-700/20 rounded-lg transition"
              aria-label="Toggle sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center flex-shrink-0">
            <span className="font-bold text-sm md:text-lg">A</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-sm md:text-base truncate">Admin Inovatech</div>
            <div className="text-xs text-gray-400">Online</div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-purple-400 font-semibold text-sm">Live Chat</div>
          {(role==='admin' ? activeEmail : userEmail) && (
            <div className="text-xs text-gray-400 truncate max-w-[150px]">{role==='admin' ? activeEmail : userEmail}</div>
          )}
        </div>
      </div>
      {/* Info error */}
      {error && (
        <div className="px-4 md:px-6 py-2 bg-red-600/20 text-red-300 text-xs md:text-sm">{error}</div>
      )}

      {/* Bubble Chat */}
      <div className="flex-1 px-3 py-4 md:px-4 md:py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-400 mt-10">
              <p className="text-lg">Belum ada percakapan</p>
              <p className="text-sm mt-2">Mulai chat dengan mengirim pesan pertama</p>
            </div>
          )}
          {messages.map((msg, idx) => {
            // Tentukan apakah pesan dari current role (tampil di kanan)
            const isMyMessage = msg.sender === role;
            
            return (
              <div key={msg._tempId || msg.id || `${msg.createdAt}-${idx}`} className={`mb-3 md:mb-4 flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}> 
                <div className="flex flex-col max-w-[85%] sm:max-w-[75%] md:max-w-[70%]">
                  {/* Label sender */}
                  <div className={`text-xs text-gray-400 mb-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                    {msg.sender === 'admin' ? 'Admin' : 'User'}
                  </div>
                  {/* Bubble */}
                  <div className={`px-3 py-2 md:px-4 md:py-3 rounded-2xl shadow-lg text-sm md:text-base break-words ${
                    isMyMessage
                      ? msg._failed 
                        ? 'bg-red-600/70' 
                        : msg._sending 
                          ? 'bg-blue-600/70' 
                          : 'bg-blue-600' 
                      : 'bg-purple-700'
                  }`}>
                    <div className="flex items-start gap-2">
                      <div className="flex-1">{msg.text}</div>
                      {isMyMessage && (
                        <div className="text-xs mt-0.5">
                          {msg._sending && <span title="Mengirim...">⏳</span>}
                          {msg._failed && <span title="Gagal kirim">❌</span>}
                          {!msg._sending && !msg._failed && <span title="Terkirim">✓</span>}
                        </div>
                      )}
                    </div>
                    {msg._failed && <div className="text-xs text-red-200 mt-1">Gagal kirim</div>}
                  </div>
                  {/* Timestamp */}
                  <div className={`text-xs text-gray-500 mt-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input Chat */}
      <div className="px-3 py-3 md:px-6 md:py-4 bg-gray-950 border-t border-purple-700 flex items-center gap-2 md:gap-3 safe-bottom">
        <input
          id="chat-message"
          name="message"
          className="flex-1 px-3 py-2.5 md:px-4 md:py-3 rounded-full bg-gray-800 text-white text-sm md:text-base focus:outline-none focus:ring-2 focus:ring-purple-600"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
          placeholder="Tulis pesan..."
        />
        <button
          className="px-4 py-2.5 md:px-6 md:py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white text-sm md:text-base font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          <span className="hidden sm:inline">Kirim</span>
          <span className="sm:hidden">📤</span>
        </button>
      </div>
      </div>
    </div>
  );
};

export default Chat;
