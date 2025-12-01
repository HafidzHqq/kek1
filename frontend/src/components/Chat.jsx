import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';

const Chat = ({ role = 'user' }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const pollRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get('/api/chat');
      if (Array.isArray(data)) setMessages(data);
    } catch {}
  };

  useEffect(() => {
    fetchMessages();
    pollRef.current = setInterval(fetchMessages, 2500);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      await axios.post('/api/chat', { sender: role, text: input.trim() });
      setInput('');
      fetchMessages();
    } catch {}
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
        <div className="text-purple-400 font-semibold">Live Chat</div>
      </div>
      {/* Bubble Chat */}
      <div className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-2xl mx-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-4 flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}> 
              <span className={`px-5 py-3 rounded-2xl shadow-lg text-base ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-purple-700'} `}>
                {msg.text}
              </span>
            </div>
          ))}
        </div>
      </div>
      {/* Input Chat */}
      <div className="px-8 py-6 bg-gray-950 border-t border-purple-700 flex items-center">
        <input
          className="flex-1 p-3 rounded-full bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-purple-600"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Tulis pesan..."
        />
        <button
          className="ml-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full text-white font-semibold shadow-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          onClick={handleSend}
        >
          Kirim
        </button>
      </div>
    </div>
  );
};

export default Chat;
