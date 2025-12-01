const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'chat-data.json');

// Load messages from file
function loadMessages() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading messages:', e);
  }
  return { conversations: {}, messages: [] };
}

// Save messages to file
function saveMessages(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving messages:', e);
  }
}

let chatData = loadMessages();

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { sessionId } = req.query;
    if (sessionId) {
      // Get messages for specific session
      const messages = chatData.conversations[sessionId] || [];
      return res.status(200).json(messages);
    }
    // Get all conversations list
    return res.status(200).json({
      conversations: Object.keys(chatData.conversations).map(id => {
        const msgs = chatData.conversations[id] || [];
        const lastMsg = msgs[msgs.length - 1];
        return {
          sessionId: id,
          lastMessage: lastMsg?.text || '',
          lastSender: lastMsg?.sender || 'user',
          timestamp: lastMsg?.createdAt || new Date().toISOString(),
          unread: msgs.filter(m => m.sender === 'user' && !m.read).length,
          messageCount: msgs.length
        };
      }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    });
  }

  if (req.method === 'POST') {
    const { sender = 'user', text, sessionId } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId required' });
    }
    
    const msg = { 
      sender, 
      text, 
      createdAt: new Date().toISOString(),
      read: sender === 'admin' // admin messages auto-marked read
    };
    
    if (!chatData.conversations[sessionId]) {
      chatData.conversations[sessionId] = [];
    }
    chatData.conversations[sessionId].push(msg);
    saveMessages(chatData);
    
    return res.status(200).json(msg);
  }

  if (req.method === 'DELETE') {
    const { sessionId } = req.query;
    if (sessionId) {
      delete chatData.conversations[sessionId];
    } else {
      chatData = { conversations: {}, messages: [] };
    }
    saveMessages(chatData);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
