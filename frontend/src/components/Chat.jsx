import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { apiUrl, API_BASE } from '../lib/api';

const Chat = ({ role = 'user', userEmail }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [sessionId] = useState(() => {
    // Use email as sessionId if available, fallback to random
    if (userEmail) {
      // Encode email: test@example.com -> email_test_at_example_dot_com
      return `email_${userEmail.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
    }
    let id = localStorage.getItem('chatSessionId');
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('chatSessionId', id);
    }
    return id;
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
      const { data } = await axios.get(apiUrl(`/api/chat?sessionId=${sessionId}`));
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
            
            return result;
          });
        }
      }
      setError('');
    } catch (e) {
      console.error('Fetch error:', e);
      setError(`Gagal memuat pesan: ${e.message}`);
    }
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 3000); // Increase from 2.5s to 3s
    return () => pollRef.current && clearInterval(pollRef.current);
  }, []);

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
    
    // Optimistic update - langsung tampilkan di UI
    setMessages(prev => [...prev, optimisticMessage]);
    setInput('');
    
    try {
      const { data } = await axios.post(apiUrl('/api/chat'), { sender: role, text: messageText, sessionId });
      
      // Replace temp message with server response
      setMessages(prev => 
        prev.map(m => m._tempId === tempId ? { ...data, _sent: true } : m)
      );
      // Force refresh hash to trigger next poll update
      lastHashRef.current = '';
      setError('');
    } catch (e) {
      console.error('Send error:', e);
      setError(`Gagal mengirim: ${e.message}`);
      // Mark as failed
      setMessages(prev => 
        prev.map(m => m._tempId === tempId ? { ...m, _failed: true, _sending: false } : m)
      );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-blue-950 to-purple-900 text-white">
      {/* Header Chat */}
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
          {userEmail && <div className="text-xs text-gray-400">{userEmail}</div>}
        </div>
      </div>
      {/* Info error */}
      {error && (
        <div className="px-8 py-3 bg-red-600/20 text-red-300 text-sm">{error}</div>
      )}

      {/* Bubble Chat */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={msg._tempId || `${msg.createdAt}-${idx}`} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
              <div className={`px-5 py-3 rounded-2xl shadow-lg text-base ${
                msg.sender === 'user' 
                  ? msg._failed 
                    ? 'bg-red-600/70' 
                    : msg._sending 
                      ? 'bg-blue-600/70' 
                      : 'bg-blue-600' 
                  : 'bg-purple-700'
              }`}>
                <div className="flex items-start gap-2">
                  <div className="flex-1">{msg.text}</div>
                  {msg.sender === 'user' && (
                    <div className="text-xs mt-0.5">
                      {msg._sending && <span title="Mengirim...">⏳</span>}
                      {msg._failed && <span title="Gagal kirim">❌</span>}
                      {!msg._sending && !msg._failed && <span title="Terkirim">✓</span>}
                    </div>
                  )}
                </div>
                {msg._failed && <div className="text-xs text-red-200 mt-1">Gagal kirim</div>}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Input Chat */}
      <div className="px-8 py-6 bg-gray-950 border-t border-purple-700 flex items-center">
        <input
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
  );
};

export default Chat;
