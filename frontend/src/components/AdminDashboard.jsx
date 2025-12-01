import React, { useEffect, useMemo, useState } from "react";
import { LayoutDashboard, MessageSquare, Users, Settings, LogOut, Mail, UserCircle2 } from "lucide-react";

export function AdminDashboard({ onLogout }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState("overview");

  useEffect(() => {
    // Dummy fetch; ganti dengan API nyata jika tersedia
    fetch("/api/contact")
      .then((res) => res.ok ? res.json() : [])
      .then((data) => {
        setMessages(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    totalMessages: messages.length,
    activeChats: Math.min(3, messages.length),
    totalUsers: 5,
  }), [messages.length]);

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
              <div className="lg:col-span-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 font-semibold">Daftar Chat</div>
                <div className="max-h-[60vh] overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="p-4 text-white/60">Belum ada chat.</div>
                  ) : messages.map((m, i) => (
                    <div key={i} className="p-4 hover:bg-white/5 cursor-pointer border-b border-white/5">
                      <div className="font-medium">{m.name || 'User'}</div>
                      <div className="text-sm text-white/60 truncate">{m.message || '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:col-span-2 bg-white/5 rounded-xl border border-white/10 flex flex-col min-h-[60vh]">
                <div className="px-4 py-3 border-b border-white/10 font-semibold">Ruang Chat</div>
                <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                  <div className="flex justify-start"><div className="max-w-[70%] px-4 py-2 rounded-2xl bg-white/10">Halo Admin!</div></div>
                  <div className="flex justify-end"><div className="max-w-[70%] px-4 py-2 rounded-2xl bg-indigo-600">Siap, ada yang bisa dibantu?</div></div>
                </div>
                <div className="p-3 border-t border-white/10 flex gap-2">
                  <input className="flex-1 bg-white/10 rounded-lg px-3 py-2 outline-none focus:ring-2 ring-indigo-600" placeholder="Tulis pesan..." />
                  <button className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700">Kirim</button>
                </div>
              </div>
            </section>
          )}

          {active === "users" && (
            <section className="bg-white/5 rounded-xl border border-white/10">
              <div className="px-5 py-3 border-b border-white/10 font-semibold">Daftar Users</div>
              <div className="p-5 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-white/60">
                    <tr><th className="py-2">Nama</th><th>Email</th><th>Role</th></tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    <tr><td className="py-2">Admin</td><td>gegefans0@gmail.com</td><td>admin</td></tr>
                    <tr><td className="py-2">User Demo</td><td>user@example.com</td><td>user</td></tr>
                  </tbody>
                </table>
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
