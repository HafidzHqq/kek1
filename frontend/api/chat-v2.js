// Universal chat API - auto-detects MongoDB, then Postgres, then MySQL, else falls back to file storage
const pgDb = require('./_pg');
const chatPG = require('./_chat_pg');
const mongoDb = require('./_mongo');
const chatMongo = require('./_chat_mongo');
const { getPool } = require('./_mysql');
const chatMySQL = require('./_chat_mysql');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join('/tmp', 'chat-data.json');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// File storage helpers (fallback)
function loadMessagesFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('[Chat File] Error loading messages:', e.message);
  }
  return { conversations: {}, messages: [] };
}

function saveMessagesFile(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[Chat File] Error saving messages:', e.message);
  }
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // prefer MongoDB, then Postgres, then MySQL, else file
  let driver = 'file';
  const mongo = await mongoDb.getDb();
  if (mongo) driver = 'mongo';
  else {
    const pgPool = await pgDb.getPool();
    if (pgPool) driver = 'postgres';
    else if (await getPool()) driver = 'mysql';
  }
  console.log(`[Chat] Using ${driver === 'mongo' ? 'MongoDB 🍃' : driver === 'postgres' ? 'Postgres 🐘' : driver === 'mysql' ? 'MySQL 💾' : 'File Storage 📂'}`);

  try {
    // GET - Retrieve messages
    if (req.method === 'GET') {
      const { sessionId } = req.query;

      if (sessionId) {
        // Get messages for specific session
        if (driver === 'mongo') {
          const messages = await chatMongo.getMessages(sessionId);
          return res.status(200).json(messages);
        } else if (driver === 'postgres') {
          const messages = await chatPG.getMessages(sessionId);
          return res.status(200).json(messages);
        } else if (driver === 'mysql') {
          const messages = await chatMySQL.getMessages(sessionId);
          return res.status(200).json(messages);
        } else {
          // File storage fallback
          const chatData = loadMessagesFile();
          const messages = chatData.conversations[sessionId] || [];
          console.log(`[Chat File] 📂 Returning ${messages.length} messages for ${sessionId}`);
          return res.status(200).json(messages);
        }
      } else {
        // Get all conversations
        if (driver === 'mongo') {
          const conversations = await chatMongo.getConversations();
          return res.status(200).json({ conversations });
        } else if (driver === 'postgres') {
          const conversations = await chatPG.getConversations();
          return res.status(200).json({ conversations });
        } else if (driver === 'mysql') {
          const conversations = await chatMySQL.getConversations();
          return res.status(200).json({ conversations });
        } else {
          // File storage fallback
          const chatData = loadMessagesFile();
          const conversations = Object.keys(chatData.conversations)
            .map((id) => {
              const msgs = chatData.conversations[id] || [];
              const lastMsg = msgs[msgs.length - 1];
              return {
                sessionId: id,
                lastMessage: lastMsg?.text || '',
                lastSender: lastMsg?.sender || 'user',
                timestamp: lastMsg?.createdAt || new Date().toISOString(),
                unread: msgs.filter((m) => m.sender === 'user' && !m.read).length,
                messageCount: msgs.length,
              };
            })
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
          
          return res.status(200).json({ conversations });
        }
      }
    }

    // POST - Send message
    if (req.method === 'POST') {
      const { sender = 'user', text, sessionId } = req.body || {};
      
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'text required' });
      }
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId required' });
      }

      if (driver === 'mongo') {
        const message = await chatMongo.saveMessage(sessionId, sender, text);
        if (!message) {
          return res.status(500).json({ error: 'Failed to save message' });
        }
        return res.status(200).json(message);
      } else if (driver === 'postgres') {
        const message = await chatPG.saveMessage(sessionId, sender, text);
        if (!message) {
          return res.status(500).json({ error: 'Failed to save message' });
        }
        return res.status(200).json(message);
      } else if (driver === 'mysql') {
        const message = await chatMySQL.saveMessage(sessionId, sender, text);
        if (!message) {
          return res.status(500).json({ error: 'Failed to save message' });
        }
        return res.status(200).json(message);
      } else {
        // File storage fallback
        let chatData = loadMessagesFile();
        
        const msg = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sender,
          text,
          createdAt: new Date().toISOString(),
          read: sender === 'admin',
        };

        if (!chatData.conversations[sessionId]) {
          chatData.conversations[sessionId] = [];
        }
        chatData.conversations[sessionId].push(msg);
        saveMessagesFile(chatData);

        console.log(`[Chat File] 💾 Message saved, total: ${chatData.conversations[sessionId].length}`);
        return res.status(200).json(msg);
      }
    }

    // DELETE - Delete messages
    if (req.method === 'DELETE') {
      const { sessionId } = req.query;

      if (driver === 'mongo') {
        await chatMongo.deleteMessages(sessionId || null);
        return res.status(200).json({ ok: true });
      } else if (driver === 'postgres') {
        await chatPG.deleteMessages(sessionId || null);
        return res.status(200).json({ ok: true });
      } else if (driver === 'mysql') {
        await chatMySQL.deleteMessages(sessionId || null);
        return res.status(200).json({ ok: true });
      } else {
        // File storage fallback
        let chatData = loadMessagesFile();
        if (sessionId) {
          delete chatData.conversations[sessionId];
        } else {
          chatData = { conversations: {}, messages: [] };
        }
        saveMessagesFile(chatData);
        return res.status(200).json({ ok: true });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('[Chat] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
