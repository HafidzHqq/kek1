import React, { useEffect, useState } from "react";

export function AdminDashboard() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dummy fetch, replace with real API if available
    fetch("/api/contact")
      .then(res => res.json())
      .then(data => {
        setMessages(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-black flex flex-col items-center py-12">
      <div className="w-full max-w-2xl bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-800">
        <h2 className="mb-6 text-3xl font-bold text-indigo-400 text-center">Admin Dashboard</h2>
        <h3 className="mb-4 text-xl font-semibold text-purple-300 text-center">Pesan dari User</h3>
        {loading ? (
          <div className="text-white text-center">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-gray-400 text-center">Belum ada pesan.</div>
        ) : (
          <ul className="space-y-4">
            {messages.map((msg, idx) => (
              <li key={idx} className="bg-gray-800 rounded-lg p-4 shadow">
                <div className="text-white font-bold">{msg.name} ({msg.email})</div>
                <div className="text-gray-300 mt-2">{msg.message}</div>
                <div className="text-xs text-gray-500 mt-1">{msg.createdAt ? new Date(msg.createdAt).toLocaleString() : ""}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
