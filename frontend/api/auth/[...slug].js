const fs = require('fs');
const path = require('path');

const USERS_FILE = path.join('/tmp', 'users-data.json');
const SESSIONS_FILE = path.join('/tmp', 'sessions-data.json');
const ADMIN_EMAIL = 'gegefans0@gmail.com';

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

function loadUsers() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading users:', e);
  }
  return {};
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving users:', e);
  }
}

function loadSessions() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error loading sessions:', e);
  }
  return {};
}

function saveSessions(sessions) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving sessions:', e);
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
  
  const users = loadUsers();
  const sessions = loadSessions();

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
    saveUsers(users);
    
    const token = generateToken();
    sessions[token] = {
      email,
      role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    saveSessions(sessions);
    
    return res.status(200).json({
      success: true,
      token,
      user: { email, name: users[email].name, role }
    });
  }

  // POST /api/auth/login
  if (req.method === 'POST' && endpoint === '/login') {
    const { email, password } = req.body || {};
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email dan password wajib diisi' });
    }
    
    const user = users[email];
    if (!user) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    
    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: 'Email atau password salah' });
    }
    
    const token = generateToken();
    sessions[token] = {
      email: user.email,
      role: user.role,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    saveSessions(sessions);
    
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
    
    if (!token) {
      return res.status(401).json({ error: 'Token tidak ditemukan' });
    }
    
    const session = sessions[token];
    if (!session) {
      return res.status(401).json({ error: 'Session tidak valid' });
    }
    
    if (new Date(session.expiresAt) < new Date()) {
      delete sessions[token];
      saveSessions(sessions);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    const user = users[session.email];
    if (!user) {
      return res.status(401).json({ error: 'User tidak ditemukan' });
    }
    
    return res.status(200).json({
      success: true,
      user: { email: user.email, name: user.name, role: user.role }
    });
  }

  // POST /api/auth/logout
  if (req.method === 'POST' && endpoint === '/logout') {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '');
    
    if (token && sessions[token]) {
      delete sessions[token];
      saveSessions(sessions);
    }
    
    return res.status(200).json({ success: true });
  }

  return res.status(404).json({ error: 'Endpoint tidak ditemukan' });
};
