import React, { useState } from 'react';

const Chat = () => {
  const [messages, setMessages] = useState([
    { sender: 'admin', text: 'Hi! How can I help you?' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages([...messages, { sender: 'user', text: input }]);
    setInput('');
    // TODO: Send message to backend
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}> 
            <span className={`inline-block px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-800 flex">
        <input
          className="flex-1 p-2 rounded bg-gray-800 text-white"
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type your message..."
        />
        <button
          className="ml-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded text-white font-semibold"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
