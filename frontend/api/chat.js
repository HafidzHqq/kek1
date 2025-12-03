const fs = require('fs');
const path = require('path');
const { getRedis } = require('./_redis');

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

// Redis keys
const STREAM_PREFIX = 'chat:stream:'; // per-session stream
const SESSIONS_KEY = 'chat:sessions'; // set of all sessionIds
const CONV_PREFIX = 'chat:conv:'; // per-session conversation hash

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const redis = await getRedis();
  console.log('[Chat API] Redis status:', redis ? '✅ Connected' : '❌ Using file storage');
  console.log('[Chat API] Request:', req.method, req.url);

  // Helper: fallback to file-based storage when Redis isn't configured
  async function handleWithFileStorage() {
    console.log('[Chat API] Using file storage (Redis not available)');
    
    if (req.method === 'GET') {
      const { sessionId } = req.query;
      if (sessionId) {
        const messages = chatData.conversations[sessionId] || [];
        console.log('[Chat API] File storage: Returning', messages.length, 'messages for', sessionId);
        return res.status(200).json(messages);
      }
      return res.status(200).json({
        conversations: Object.keys(chatData.conversations)
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
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
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

      console.log('[Chat API] File storage: Saving message for', sessionId);

      const msg = {
        id: `file-${Date.now()}`,
        sender,
        text,
        createdAt: new Date().toISOString(),
        read: sender === 'admin',
      };

      if (!chatData.conversations[sessionId]) {
        chatData.conversations[sessionId] = [];
      }
      chatData.conversations[sessionId].push(msg);
      saveMessages(chatData);

      console.log('[Chat API] File storage: Message saved, total messages:', chatData.conversations[sessionId].length);
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

  // If Redis isn't set up, use file fallback
  if (!redis) {
    console.log('[Chat API] Redis not configured, using file storage');
    return handleWithFileStorage();
  }

  // Redis-backed queue (Streams) implementation
  const toIso = (streamId) => {
    const ms = Number(String(streamId).split('-')[0] || Date.now());
    return new Date(ms).toISOString();
  };

  try {
    if (req.method === 'GET') {
      const { sessionId, cursor, limit } = req.query;
      const count = Math.min(Number(limit) || 100, 200);

      if (sessionId) {
        console.log('[Chat API] GET messages for sessionId:', sessionId);
        const streamKey = `${STREAM_PREFIX}${sessionId}`;
        
        // Check if stream exists
        const exists = await redis.exists(streamKey);
        console.log('[Chat API] Stream exists:', exists);
        
        if (!exists) {
          console.log('[Chat API] Stream not found, returning empty array');
          return res.status(200).json([]);
        }
        
        // Read all messages from stream (simplified query)
        let entries;
        try {
          entries = await redis.xrange(streamKey, '-', '+');
          console.log('[Chat API] xrange returned:', entries ? entries.length : 0, 'entries');
          console.log('[Chat API] Raw entries:', JSON.stringify(entries));
        } catch (e) {
          console.error('[Chat API] Error reading stream:', e.message);
          console.log('[Chat API] Falling back to file storage');
          return handleWithFileStorage();
        }

        const messages = (entries || []).map(([id, fields]) => {
          const obj = Object.fromEntries(fields);
          return {
            id,
            sender: obj.sender || 'user',
            text: obj.text || '',
            createdAt: obj.createdAt || toIso(id),
          };
        });

        console.log('[Chat API] Returning', messages.length, 'messages for', sessionId);
        return res.status(200).json(messages);
      }

      // Conversations list
      console.log('[Chat API] GET conversations list');
      const sessionIds = (await redis.smembers(SESSIONS_KEY)) || [];
      console.log('[Chat API] Found', sessionIds.length, 'sessions:', sessionIds);
      
      const convs = [];
      for (const id of sessionIds) {
        const key = `${STREAM_PREFIX}${id}`;
        try {
          const last = await redis.xrevrange(key, '+', '-');
          const length = (await redis.xlen(key)) || 0;
          
          // Take first item (most recent)
          const [lastId, lastFields] = last?.[0] || [null, []];
          const lastObj = Object.fromEntries(lastFields || []);
          
          convs.push({
            sessionId: id,
            lastMessage: lastObj.text || '',
            lastSender: lastObj.sender || 'user',
            timestamp: lastObj.createdAt || (lastId ? toIso(lastId) : new Date(0).toISOString()),
            unread: 0,
            messageCount: length,
          });
        } catch (e) {
          console.error('[Chat API] Error reading stream for', id, ':', e);
        }
      }
      convs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      console.log('[Chat API] Returning', convs.length, 'conversations');
      return res.status(200).json({ conversations: convs });
    }

    if (req.method === 'POST') {
      const { sender = 'user', text, sessionId } = req.body || {};
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'text required' });
      }
      if (!sessionId) {
        return res.status(400).json({ error: 'sessionId required' });
      }

      console.log('[Chat API] POST message:', { sessionId, sender, text: text.substring(0, 50) });

      const streamKey = `${STREAM_PREFIX}${sessionId}`;
      const createdAt = new Date().toISOString();
      const id = await redis.xadd(streamKey, '*', {
        sender,
        text,
        createdAt,
      });
      await redis.sadd(SESSIONS_KEY, sessionId);
      await redis.hset(`${CONV_PREFIX}${sessionId}`, {
        lastMessage: text,
        lastSender: sender,
        timestamp: createdAt,
      });

      console.log('[Chat API] Message saved with id:', id);
      return res.status(200).json({ id, sender, text, createdAt });
    }

    if (req.method === 'DELETE') {
      const { sessionId } = req.query;
      if (sessionId) {
        // Delete a single stream and metadata
        await redis.del(`${STREAM_PREFIX}${sessionId}`);
        await redis.hdel(`${CONV_PREFIX}${sessionId}`, 'lastMessage', 'lastSender', 'timestamp');
        await redis.srem(SESSIONS_KEY, sessionId);
      } else {
        const sessionIds = (await redis.smembers(SESSIONS_KEY)) || [];
        const keys = sessionIds.map((id) => `${STREAM_PREFIX}${id}`);
        if (keys.length) await redis.del(...keys);
        await redis.del(SESSIONS_KEY);
      }
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (err) {
    console.error('Chat API (Redis) error:', err);
    // Fallback on error to file-based to keep UX working
    return handleWithFileStorage();
  }
}
