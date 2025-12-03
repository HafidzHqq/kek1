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
  const lastHashRef = useRef('');
  const emailRef = useRef(userEmail);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      console.log('[Chat] Fetching messages for sessionId:', sessionId, 'Role:', role);
      const { data } = await axios.get(apiUrl(`/api/chat?sessionId=${sessionId}`));
      console.log('[Chat] Received', Array.isArray(data) ? data.length : 0, 'messages:', data);
      
      if (Array.isArray(data)) {
        const currentHash = JSON.stringify(data.map(m => ({ t: m.createdAt, s: m.sender })));
        
        // Only update if messages actually changed
        if (currentHash !== lastHashRef.current) {
          lastHashRef.current = currentHash;
          
          setMessages(prev => {
            // Create a map of existing messages by createdAt
            const existingMap = new Map();
            prev.forEach(m => {
              if (m.createdAt) existingMap.set(m.createdAt, m);
            });
            
            // Add server messages to map (server is source of truth)
            data.forEach(m => {
              existingMap.set(m.createdAt, m);
            });
            
            // Keep temp messages that are still sending or failed
            const tempMessages = prev.filter(m => m._tempId && (m._sending || m._failed));
            
            // Combine: confirmed messages + temp messages
            const result = [...existingMap.values(), ...tempMessages].sort((a, b) => 
              new Date(a.createdAt) - new Date(b.createdAt)
            );
            
            console.log('[Chat] Updated messages count:', result.length);
            return result;
          });
        }
      }
      setError('');
    } catch (e) {
      console.error('[Chat] Fetch error:', e);
      setError(`Gagal memuat pesan: ${e.message}`);
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
    console.log('[Chat] SessionId changed to:', sessionId);
    lastHashRef.current = '';
    setMessages([]); // Clear messages saat ganti room
    
    // Fetch pertama kali
    fetchMessages();
    
    // Setup polling
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(fetchMessages, 3000);
    
    // Cleanup saat unmount atau sessionId berubah
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [sessionId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const messageText = input.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      sender: role,
      text: messageText,
      createdAt: new Date().toISOString(),
      _tempId: tempId,
      _sending: true
    };
    
    console.log('[Chat] Sending message:', { sessionId, sender: role, text: messageText });
    
    // Optimistic update - langsung tampilkan di UI
    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');
    
    try {
      const { data } = await axios.post(apiUrl('/api/chat'), { sender: role, text: messageText, sessionId });
      
      console.log('[Chat] Message sent successfully:', data);
      
      // Replace temp message with server response
      setMessages(prev => 
        prev.map(m => m._tempId === tempId ? { ...data, _sent: true } : m)
      );
      // Force refresh hash to trigger next poll update
      lastHashRef.current = '';
      setError('');
    } catch (e) {
      console.error('[Chat] Send error:', e);
      setError(`Gagal mengirim: ${e.message}`);
      // Mark as failed
      setMessages(prev => 
        prev.map(m => m._tempId === tempId ? { ...m, _failed: true, _sending: false } : m)
      );
    }
  };

  return (
    <div className={`h-screen ${role==='admin' ? 'grid grid-cols-[320px_1fr]' : 'flex flex-col'} bg-gradient-to-br from-gray-900 via-blue-950 to-purple-900 text-white`}>
      {/* Sidebar untuk admin: daftar semua akun */}
      {role === 'admin' && (
        <div className="bg-gray-950 border-r border-purple-700 overflow-y-auto">
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
      <div className="flex flex-col">
      <div className="py-6 px-8 bg-gray-950 border-b border-purple-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <span className="font-bold text-lg">A</span>
          </div>
          <div>
            <div className="font-semibold text-lg">Admin Inovatech</div>
            <div className="text-xs text-gray-400">Online</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-purple-400 font-semibold">Live Chat</div>
          {(role==='admin' ? activeEmail : userEmail) && (
            <div className="text-xs text-gray-400">{role==='admin' ? activeEmail : userEmail}</div>
          )}
        </div>
      </div>
      {/* Info error */}
      {error && (
        <div className="px-8 py-3 bg-red-600/20 text-red-300 text-sm">{error}</div>
      )}

      {/* Bubble Chat */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
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
              <div key={msg._tempId || msg.id || `${msg.createdAt}-${idx}`} className={`mb-4 flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}> 
                <div className="flex flex-col max-w-[70%]">
                  {/* Label sender */}
                  <div className={`text-xs text-gray-400 mb-1 ${isMyMessage ? 'text-right' : 'text-left'}`}>
                    {msg.sender === 'admin' ? 'Admin' : 'User'}
                  </div>
                  {/* Bubble */}
                  <div className={`px-5 py-3 rounded-2xl shadow-lg text-base ${
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
      <div className="px-8 py-6 bg-gray-950 border-t border-purple-700 flex items-center">
        <input
          id="chat-message"
          name="message"
          className="flex-1 p-3 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
          placeholder="Tulis pesan..."
        />
        <button
          className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          onClick={handleSend}
          disabled={!input.trim()}
        >
          Kirim
        </button>
      </div>
      </div>
    </div>
  );
};

export default Chat;
