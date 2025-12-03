const fs = require('fs');
const path = require('path');
const { getRedis } = require('../_redis');

const USERS_FILE = path.join('/tmp', 'users-data.json');
const SESSIONS_FILE = path.join('/tmp', 'sessions-data.json');
const ADMIN_EMAIL = 'gegefans0@gmail.com';
const REDIS_USERS_KEY = 'auth:users';
const REDIS_SESSIONS_KEY = 'auth:sessions';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

async function loadUsers(redis) {
  if (redis) {
    try {
      const data = await redis.hgetall(REDIS_USERS_KEY);
      if (data && Object.keys(data).length > 0) {
        const users = {};
        for (const [email, json] of Object.entries(data)) {
          users[email] = JSON.parse(json);
        }
        console.log(`[Auth] ✅ Loaded ${Object.keys(users).length} users from Redis`);
        return users;
      }
      console.log('[Auth] Redis connected but no users found');
    } catch (e) {
      console.error('Error loading users from Redis:', e);
    }
  }
  // Fallback to file
  try {
    if (fs.existsSync(USERS_FILE)) {
      const users = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
      console.log(`[Auth] Loaded ${Object.keys(users).length} users from file (fallback)`);
      return users;
    }
  } catch (e) {
    console.error('Error loading users from file:', e);
  }
  return {};
}

async function saveUsers(users, redis) {
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      for (const [email, user] of Object.entries(users)) {
        pipeline.hset(REDIS_USERS_KEY, email, JSON.stringify(user));
      }
      await pipeline.exec();
      console.log(`[Auth] ✅ Saved ${Object.keys(users).length} users to Redis`);
    } catch (e) {
      console.error('Error saving users to Redis:', e);
    }
  } else {
    console.log('[Auth] ⚠️ Redis not available, using file storage only');
  }
  // Also save to file as backup
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving users to file:', e);
  }
}

async function loadSessions(redis) {
  if (redis) {
    try {
      const data = await redis.hgetall(REDIS_SESSIONS_KEY);
      if (data && Object.keys(data).length > 0) {
        const sessions = {};
        for (const [token, json] of Object.entries(data)) {
          sessions[token] = JSON.parse(json);
        }
        console.log(`[Auth] ✅ Loaded ${Object.keys(sessions).length} sessions from Redis`);
        return sessions;
      }
      console.log('[Auth] Redis connected but no sessions found');
    } catch (e) {
      console.error('Error loading sessions from Redis:', e);
    }
  }
  // Fallback to file
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const sessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
      console.log(`[Auth] Loaded ${Object.keys(sessions).length} sessions from file (fallback)`);
      return sessions;
    }
  } catch (e) {
    console.error('Error loading sessions from file:', e);
  }
  console.log('[Auth] No sessions found');
  return {};
}

async function saveSessions(sessions, redis) {
  if (redis) {
    try {
      const pipeline = redis.pipeline();
      for (const [token, session] of Object.entries(sessions)) {
        pipeline.hset(REDIS_SESSIONS_KEY, token, JSON.stringify(session));
      }
      await pipeline.exec();
      console.log(`[Auth] ✅ Saved ${Object.keys(sessions).length} sessions to Redis`);
    } catch (e) {
      console.error('Error saving sessions to Redis:', e);
    }
  } else {
    console.log('[Auth] ⚠️ Redis not available, using file storage only for sessions');
  }
  // Also save to file as backup
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving sessions to file:', e);
  }
}

function hashPassword(password) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password + 'salt123').digest('hex');
}

function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

function generateToken() {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { pathname } = require('url').parse(req.url, true);
  const endpoint = pathname.replace('/api/auth', '');
  
  const redis = await getRedis();
  console.log('[Auth] Redis connection status:', redis ? '✅ Connected' : '❌ Not connected (using file storage)');
  const users = await loadUsers(redis);
  const sessions = await loadSessions(redis);

  // POST /api/auth/register
  if (req.method === 'POST' && endpoint === '/register') {
    const { email, password, name } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }
    
    if (users[email]) {
      return res.status(400).json({ error: 'Email sudah terdaftar' });
    }
    
    const role = email === ADMIN_EMAIL ? 'admin' : 'user';
    users[email] = {
      email,
      name: name || email.split('@')[0],
      passwordHash: hashPassword(password),
      role,
      createdAt: new Date().toISOString()
    };
    await saveUsers(users, redis);
    
    const token = generateToken();
    sessions[token] = {
      email,
      role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    await saveSessions(sessions, redis);
    
    return res.status(200).json({
      success: true,
      token,
      user: { email, name: users[email].name, role }
    });
  }

  // POST /api/auth/login
  if (req.method === 'POST' && endpoint === '/login') {
    const { email, password } = req.body || {};
    
    console.log('[Auth] Login attempt for email:', email);
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }
    
    const user = users[email];
    if (!user) {
      console.log('[Auth] Login failed: user not found');
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    
    if (!verifyPassword(password, user.passwordHash)) {
      console.log('[Auth] Login failed: wrong password');
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    
    const token = generateToken();
    sessions[token] = {
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    await saveSessions(sessions, redis);
    
    console.log('[Auth] Login successful for:', email, 'Token:', token.substring(0, 10) + '...');
    
    return res.status(200).json({
      success: true,
      token,
      user: { email: user.email, name: user.name, role: user.role }
    });
  }

  // GET /api/auth/verify
  if (req.method === 'GET' && endpoint === '/verify') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    console.log('[Auth] Verify request, token:', token ? token.substring(0, 10) + '...' : 'none');
    console.log('[Auth] Available sessions:', Object.keys(sessions).length);
    
    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    
    const session = sessions[token];
    if (!session) {
      console.log('[Auth] Session not found for token');
      return res.status(401).json({ error: 'Session tidak valid' });
    }
    
    if (new Date(session.expiresAt) < new Date()) {
      console.log('[Auth] Session expired');
      delete sessions[token];
      if (redis) {
        await redis.hdel(REDIS_SESSIONS_KEY, token);
      }
      await saveSessions(sessions, redis);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    const user = users[session.email];
    if (!user) {
      console.log('[Auth] User not found:', session.email);
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }
    
    console.log('[Auth] Session valid for user:', user.email);
    return res.status(200).json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role }
    });
  }

  // GET /api/auth/users
  // Mengembalikan daftar semua akun terdaftar (admin-only)
  if (req.method === 'GET' && endpoint === '/users') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token || !sessions[token]) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const session = sessions[token];
    const requester = users[session.email];
    if (!requester || requester.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: admin only' });
    }
    const list = Object.values(users).map(u => ({
      email: u.email,
      name: u.name,
      role: u.role,
      createdAt: u.createdAt
    }));
    return res.status(200).json({ success: true, users: list });
  }

  // POST /api/auth/logout
  if (req.method === 'POST' && endpoint === '/logout') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (token && sessions[token]) {
      delete sessions[token];
      if (redis) {
        await redis.hdel(REDIS_SESSIONS_KEY, token);
      }
      await saveSessions(sessions, redis);
    }
    
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
};
