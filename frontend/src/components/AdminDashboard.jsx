import React, { useEffect, useMemo, useState, useRef } from "react";
import { LayoutDashboard, MessageSquare, Users, Settings, LogOut, Mail, UserCircle2, Clock } from "lucide-react";
import { apiUrl } from '../lib/api';

// Helper function to decode email from sessionId
const decodeEmail = (sessionId) => {
  if (sessionId.startsWith('email_')) {
    return sessionId.replace('email_', '').replace(/_at_/g, '@').replace(/_dot_/g, '.').replace(/_/g, '.');
  }
  return `User ${sessionId.substring(0, 12)}`;
};

export function AdminDashboard({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("overview");
  const [conversations, setConversations] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [users, setUsers] = useState([]);
  const chatEndRef = useRef(null);
  const hasAutoSelected = useRef(false);
  const lastConversationsHash = useRef('');
  const lastMessagesHash = useRef('');

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    // Fetch contacts/messages
    fetch(apiUrl("/api/contact"))
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    
    // Fetch users dari API
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(apiUrl('/api/auth/users'), {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data?.success && Array.isArray(data.users)) {
          setUsers(data.users);
        }
      } catch (e) {
        console.error('Error fetching users:', e);
      }
    };
    fetchUsers();
  }, []);

  // Polling untuk daftar conversations - selalu fetch meskipun tidak di tab chat
  useEffect(() => {
    let timer;
    const fetchConversations = async () => {
      try {
        const res = await fetch(apiUrl('/api/chat'));
        const data = await res.json();
        if (data.conversations) {
          const currentHash = JSON.stringify(data.conversations.map(c => ({ id: c.sessionId, count: c.messageCount, last: c.timestamp })));
          
          // Only update if actually changed
          if (currentHash !== lastConversationsHash.current) {
            lastConversationsHash.current = currentHash;
            setConversations(data.conversations);
            
            // Auto-select first conversation only once when entering chat tab
            if (active === 'chat' && !hasAutoSelected.current && !selectedSession && data.conversations.length > 0) {
              setSelectedSession(data.conversations[0].sessionId);
              hasAutoSelected.current = true;
            }
          }
        }
      } catch (e) {
        console.error('Error fetching conversations:', e);
      }
    };
    fetchConversations();
    timer = setInterval(fetchConversations, 5000); // Poll every 5 seconds
    return () => clearInterval(timer);
  }, [selectedSession, active]);

  // Polling untuk chat messages dari selected session
  useEffect(() => {
    if (!selectedSession || active !== 'chat') return;
    let timer;
    let isMounted = true;
    
    const fetchChat = async () => {
      try {
        console.log('[Admin] Fetching messages for sessionId:', selectedSession);
        const res = await fetch(apiUrl(`/api/chat?sessionId=${selectedSession}`));
        const data = await res.json();
        console.log('[Admin] Received messages:', data);
        
        if (Array.isArray(data) && isMounted) {
          const currentHash = JSON.stringify(data.map(m => ({ t: m.createdAt, s: m.sender })));
          
          // Only update if messages actually changed
          if (currentHash !== lastMessagesHash.current) {
            lastMessagesHash.current = currentHash;
            
            setChatMessages(prev => {
              // Create a map of existing messages by createdAt
              const existingMap = new Map();
              prev.forEach(m => {
                if (m.createdAt) existingMap.set(m.createdAt, m);
              });
              
              // Add server messages to map (server is source of truth for sent messages)
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
        } else {
          // Data kosong, set empty array
          if (isMounted) setChatMessages([]);
        }
      } catch (e) {
        console.error('[Admin] Error fetching chat:', e);
      }
    };
    fetchChat();
    timer = setInterval(fetchChat, 3000); // Poll every 3 seconds
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [selectedSession, active]);

  const sendChat = async () => {
    if (!chatInput.trim() || !selectedSession) return;
    
    const messageText = chatInput.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      sender: 'admin',
      text: messageText,
      createdAt: new Date().toISOString(),
      _tempId: tempId,
      _sending: true
    };
    
    // Optimistic update - langsung tampilkan di UI
    setChatMessages(prev => [...prev, optimisticMessage]);
    setChatInput('');
    
    try {
      const res = await fetch(apiUrl('/api/chat'), { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ sender: 'admin', text: messageText, sessionId: selectedSession }) 
      });
      
      if (res.ok) {
        // Replace temp message with server response
        const serverMessage = await res.json();
        setChatMessages(prev => 
          prev.map(m => m._tempId === tempId ? { ...serverMessage, _sent: true } : m)
        );
        // Force refresh hash to trigger next poll update
        lastMessagesHash.current = '';
      } else {
        console.error('Send failed with status:', res.status);
        setChatMessages(prev => 
          prev.map(m => m._tempId === tempId ? { ...m, _failed: true, _sending: false } : m)
        );
      }
    } catch (e) {
      console.error('Error sending chat:', e);
      setChatMessages(prev => 
        prev.map(m => m._tempId === tempId ? { ...m, _failed: true, _sending: false } : m)
      );
    }
  };

  const stats = useMemo(() => {
    // Hitung total messages dari semua conversations
    const totalMessages = conversations.reduce((sum, conv) => sum + (conv.messageCount || 0), 0);
    const activeChats = conversations.filter(conv => conv.messageCount > 0).length;
    
    return {
      totalMessages,
      activeChats,
      totalUsers: users.length,
    };
  }, [conversations, users.length]);

  return (
    <div className="min-h-screen grid grid-cols-12 bg-[#0b0b13] text-white">
      {/* Sidebar */}
      <aside className="col-span-12 md:col-span-3 xl:col-span-2 border-r border-white/5 bg-[#0f1020]">
        <div className="px-6 py-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center font-bold">IA</div>
          <div>
            <div className="font-bold">Inovatech Admin</div>
            <div className="text-xs text-white/50">Control Panel</div>
          </div>
        </div>
        <nav className="mt-2 px-2 space-y-1">
          <SidebarItem active={active==="overview"} onClick={() => setActive("overview")} icon={LayoutDashboard} label="Overview" />
          <SidebarItem active={active==="chat"} onClick={() => setActive("chat")} icon={MessageSquare} label="Chat" />
          <SidebarItem active={active==="users"} onClick={() => setActive("users")} icon={Users} label="Users" />
          <SidebarItem active={active==="settings"} onClick={() => setActive("settings")} icon={Settings} label="Settings" />
        </nav>
        <div className="mt-auto px-4 py-6 hidden md:block">
          <button onClick={() => onLogout && onLogout()} className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg:white/10 bg-white/10 hover:bg-white/15 transition px-4 py-2">
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="col-span-12 md:col-span-9 xl:col-span-10">
        {/* Topbar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0b0c1d] sticky top-0 z-10">
          <div className="font-semibold">{active === 'overview' ? 'Overview' : active === 'chat' ? 'Chat' : active === 'users' ? 'Users' : 'Settings'}</div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-white/70"><Mail size={16} />admin@inovatech.com</div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 grid place-items-center"><UserCircle2 size={18} /></div>
            <button onClick={() => onLogout && onLogout()} className="inline-flex items-center gap-2 rounded-md bg-white/10 hover:bg-white/15 px-3 py-2 text-sm">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {active === "overview" && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Stat title="Total Messages" value={stats.totalMessages} />
                <Stat title="Active Chats" value={stats.activeChats} />
                <Stat title="Total Users" value={stats.totalUsers} />
              </div>
              <section className="mt-6 bg-white/5 rounded-xl border border-white/10">
                <div className="px-5 py-3 border-b border-white/10 font-semibold">Pesan Terbaru</div>
                <div className="p-5">
                  {loading ? (
                    <div className="text-white/60">Memuat...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-white/60">Belum ada pesan.</div>
                  ) : (
                    <ul className="divide-y divide-white/10">
                      {messages.slice(0,5).map((m, i) => (
                        <li key={i} className="py-3 flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-indigo-600/30 grid place-items-center text-indigo-300 font-bold">{(m.name||'?').slice(0,1).toUpperCase()}</div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{m.name || 'User'} <span className="text-white/50 text-sm">({m.email||'unknown'})</span></div>
                              <div className="text-xs text-white/40">{m.createdAt ? new Date(m.createdAt).toLocaleString() : ''}</div>
                            </div>
                            <div className="text-white/80 mt-1">{m.message || m.subject || '-'}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </>
          )}

          {active === "chat" && (
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {/* Daftar Chat - Profesional */}
              <div className="lg:col-span-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-white/10 font-semibold flex items-center justify-between">
                  <span>Daftar Chat</span>
                  <span className="text-xs bg-indigo-600 px-2 py-1 rounded-full">{conversations.length}</span>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[60vh]">
                  {conversations.length === 0 ? (
                    <div className="p-4 text-white/60 text-center">Belum ada chat.</div>
                  ) : conversations.map((conv) => (
                    <div 
                      key={conv.sessionId} 
                      onClick={() => setSelectedSession(conv.sessionId)}
                      className={`p-4 hover:bg-white/10 cursor-pointer border-b border-white/5 transition-all ${selectedSession === conv.sessionId ? 'bg-white/10 border-l-4 border-l-indigo-500' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                          <UserCircle2 size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="font-medium text-sm truncate">{decodeEmail(conv.sessionId)}</div>
                            {conv.unread > 0 && (
                              <span className="bg-red-500 text-xs px-1.5 py-0.5 rounded-full">{conv.unread}</span>
                            )}
                          </div>
                          <div className="text-xs text-white/60 truncate mb-1">{conv.lastMessage}</div>
                          <div className="flex items-center gap-1 text-xs text-white/40">
                            <Clock size={12} />
                            <span>{new Date(conv.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Ruang Chat */}
              <div className="lg:col-span-2 bg-white/5 rounded-xl border border-white/10 flex flex-col min-h-[60vh]">
                <div className="px-4 py-3 border-b border-white/10 font-semibold">
                  {selectedSession ? `Chat dengan ${decodeEmail(selectedSession)}` : 'Pilih Chat'}
                </div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  {!selectedSession ? (
                    <div className="text-white/60 text-center mt-10">Pilih chat dari daftar untuk memulai percakapan.</div>
                  ) : chatMessages.length === 0 ? (
                    <div className="text-white/60 text-center mt-10">Belum ada percakapan.</div>
                  ) : (
                    <>
                      {chatMessages.map((m, i) => (
                        <div key={m._tempId || `${m.createdAt}-${i}`} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                            m.sender === 'admin' 
                              ? m._failed 
                                ? 'bg-red-600/70' 
                                : m._sending 
                                  ? 'bg-indigo-600/70' 
                                  : 'bg-indigo-600' 
                              : 'bg-white/10'
                          }`}>
                            <div className="flex items-start gap-2">
                              <div className="flex-1">{m.text}</div>
                              {m.sender === 'admin' && (
                                <div className="text-xs mt-0.5">
                                  {m._sending && <span title="Mengirim...">⏳</span>}
                                  {m._failed && <span title="Gagal kirim">❌</span>}
                                  {!m._sending && !m._failed && <span title="Terkirim">✓</span>}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-white/50 mt-1 flex items-center gap-1">
                              <span>{new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                              {m._failed && <span className="text-red-300">(Gagal)</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </>
                  )}
                </div>
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <input 
                    value={chatInput} 
                    onChange={(e)=>setChatInput(e.target.value)} 
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChat(); } }}
                    className="flex-1 bg-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-indigo-600" 
                    placeholder={selectedSession ? "Tulis pesan..." : "Pilih chat terlebih dahulu"}
                    disabled={!selectedSession}
                  />
                  <button 
                    onClick={sendChat} 
                    disabled={!selectedSession || !chatInput.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kirim
                  </button>
                </div>
              </div>
            </section>
          )}

          {active === "users" && (
            <section className="bg-white/5 rounded-xl border border-white/10">
              <div className="px-5 py-3 border-b border-white/10 font-semibold flex items-center justify-between">
                <span>Daftar Users</span>
                <span className="text-xs bg-indigo-600 px-2 py-1 rounded-full">{users.length}</span>
              </div>
              <div className="p-5 overflow-x-auto">
                {users.length === 0 ? (
                  <div className="text-white/60 text-center py-8">Belum ada user terdaftar.</div>
                ) : (
                  <table className="min-w-full text-sm">
                    <thead className="text-left text-white/60">
                      <tr>
                        <th className="py-2">Nama</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Terdaftar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/10">
                      {users.map((user, idx) => (
                        <tr key={idx}>
                          <td className="py-2">{user.name || '-'}</td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-600/30 text-purple-300' : 'bg-blue-600/30 text-blue-300'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="text-white/60 text-xs">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString('id-ID') : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {active === "settings" && (
            <section className="bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="font-semibold mb-3">Pengaturan</div>
              <div className="text-white/60">Tempat untuk konfigurasi (tema, profil admin, dst.).</div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={` w-full flex items-center gap-3 px-4 py-2 rounded-lg transition ${active ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'}`}>
      <Icon size={18} /> {label}
    </button>
  );
}

function Stat({ title, value }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 p-5">
      <div className="text-white/60 text-sm">{title}</div>
      <div className="text-3xl font-bold mt-1">{value}</div>
    </div>
  );
}
