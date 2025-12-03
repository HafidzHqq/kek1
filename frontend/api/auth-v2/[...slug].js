// Universal auth API - auto-detects Postgres, then MySQL, else falls back to file storage
const pgDb = require('../_pg');
const mongoDb = require('../_mongo');
const { getPool, initTables, cleanupExpiredSessions } = require('../_mysql');
const authMySQL = require('../_auth_mysql');
const authPG = require('../_auth_pg');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const USERS_FILE = path.join('/tmp', 'users-data.json');
const SESSIONS_FILE = path.join('/tmp', 'sessions-data.json');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// File storage helpers (fallback)
function loadUsersFile() {
  try {
    if (fs.existsSync(USERS_FILE)) {
      return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Auth File] Error loading users:', e.message);
  }
  return {};
}

function saveUsersFile(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('[Auth File] Error saving users:', e.message);
  }
}

function loadSessionsFile() {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      return JSON.parse(fs.readFileSync(SESSIONS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[Auth File] Error loading sessions:', e.message);
  }
  return {};
}

function saveSessionsFile(sessions) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2), 'utf8');
  } catch (e) {
    console.error('[Auth File] Error saving sessions:', e.message);
  }
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Prefer MongoDB; then Postgres; then MySQL; else file
  let driver = 'file';
  const mongo = await mongoDb.getDb();
  if (mongo) {
    await mongoDb.initCollections();
    if (Math.random() < 0.1) mongoDb.cleanupExpiredSessions();
    driver = 'mongo';
  } else {
    const pgPool = await pgDb.getPool();
    if (pgPool) {
      await pgDb.initTables();
      if (Math.random() < 0.1) pgDb.cleanupExpiredSessions();
      driver = 'postgres';
    } else {
      const myPool = await getPool();
      if (myPool) {
        await initTables();
        if (Math.random() < 0.1) cleanupExpiredSessions();
        driver = 'mysql';
      }
    }
  }

  console.log(`[Auth] Using ${driver === 'mongo' ? 'MongoDB' : driver === 'postgres' ? 'Postgres' : driver === 'mysql' ? 'MySQL' : 'File Storage'}`);

  const [, , action] = (req.url || '').split('/').filter(Boolean);

  try {
    // REGISTER
    if (action === 'register' && req.method === 'POST') {
      const { email, password, name } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (driver === 'mongo') {
        const authMongo = require('../_auth_mongo');
        const existing = await authMongo.getUser(email);
        if (existing) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        const role = email === (authMySQL.ADMIN_EMAIL || 'gegefans0@gmail.com') ? 'admin' : 'user';
        const user = await authMongo.createUser(email, password, name || '', role);
        if (!user) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        const session = await authMongo.createSession(email, role);
        return res.status(200).json({ success: true, token: session.token, sessionId: session.sessionId, email, role });
      } else if (driver === 'postgres') {
        const user = await authPG.createUser(email, password, name || '');
        if (!user) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        const role = email === authPG.ADMIN_EMAIL ? 'admin' : 'user';
        const session = await authPG.createSession(email, role);
        return res.status(200).json({ success: true, token: session.token, sessionId: session.sessionId, email, role });
      } else if (driver === 'mysql') {
        const user = await authMySQL.createUser(email, password, name || '');
        if (!user) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        const role = email === authMySQL.ADMIN_EMAIL ? 'admin' : 'user';
        const session = await authMySQL.createSession(email, role);
        return res.status(200).json({
          success: true,
          token: session.token,
          sessionId: session.sessionId,
          email,
          role
        });
      } else {
        // File storage fallback
        const users = loadUsersFile();
        if (users[email]) {
          return res.status(400).json({ error: 'Email already registered' });
        }
        const role = email === authMySQL.ADMIN_EMAIL ? 'admin' : 'user';
        users[email] = {
          email,
          password: hashPassword(password),
          name: name || '',
          role
        };
        saveUsersFile(users);

        const token = generateToken();
        const sessionId = `email_${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
        const sessions = loadSessionsFile();
        sessions[token] = {
          email,
          sessionId,
          role,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };
        saveSessionsFile(sessions);

        console.log(`[Auth File] ✅ User registered: ${email}`);
        return res.status(200).json({
          success: true,
          token,
          sessionId,
          email,
          role
        });
      }
    }

    // LOGIN
    if (action === 'login' && req.method === 'POST') {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
      }

      if (driver === 'mongo') {
        const authMongo = require('../_auth_mongo');
        const user = await authMongo.verifyUser(email, password);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const session = await authMongo.createSession(user.email, user.role);
        return res.status(200).json({ success: true, token: session.token, sessionId: session.sessionId, email: user.email, role: user.role });
      } else if (driver === 'postgres') {
        const user = await authPG.verifyUser(email, password);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const session = await authPG.createSession(user.email, user.role);
        return res.status(200).json({ success: true, token: session.token, sessionId: session.sessionId, email: user.email, role: user.role });
      } else if (driver === 'mysql') {
        const user = await authMySQL.verifyUser(email, password);
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }
        const session = await authMySQL.createSession(user.email, user.role);
        return res.status(200).json({
          success: true,
          token: session.token,
          sessionId: session.sessionId,
          email: user.email,
          role: user.role
        });
      } else {
        // File storage fallback
        const users = loadUsersFile();
        const user = users[email];
        if (!user || user.password !== hashPassword(password)) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = generateToken();
        const sessionId = `email_${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
        const sessions = loadSessionsFile();
        sessions[token] = {
          email,
          sessionId,
          role: user.role,
          expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
        };
        saveSessionsFile(sessions);

        console.log(`[Auth File] ✅ User logged in: ${email}`);
        return res.status(200).json({
          success: true,
          token,
          sessionId,
          email,
          role: user.role
        });
      }
    }

    // VERIFY
    if (action === 'verify' && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'No token provided' });
      }

      if (driver === 'mongo') {
        const authMongo = require('../_auth_mongo');
        const session = await authMongo.verifySession(token);
        if (!session) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }
        return res.status(200).json({ valid: true, email: session.email, sessionId: session.sessionId, role: session.role });
      } else if (driver === 'postgres') {
        const session = await authPG.verifySession(token);
        if (!session) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }
        return res.status(200).json({ valid: true, email: session.email, sessionId: session.sessionId, role: session.role });
      } else if (driver === 'mysql') {
        const session = await authMySQL.verifySession(token);
        if (!session) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }
        return res.status(200).json({
          valid: true,
          email: session.email,
          sessionId: session.sessionId,
          role: session.role
        });
      } else {
        // File storage fallback
        const sessions = loadSessionsFile();
        const session = sessions[token];
        
        if (!session || session.expiresAt < Date.now()) {
          return res.status(401).json({ error: 'Invalid or expired session' });
        }

        return res.status(200).json({
          valid: true,
          email: session.email,
          sessionId: session.sessionId,
          role: session.role
        });
      }
    }

    // LOGOUT (invalidate session token)
    if (action === 'logout' && req.method === 'POST') {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');

      // Idempotent: treat missing token as success
      if (!token) {
        return res.status(200).json({ success: true });
      }

      if (driver === 'mongo') {
        const authMongo = require('../_auth_mongo');
        await authMongo.deleteSession(token);
        return res.status(200).json({ success: true });
      } else if (driver === 'postgres') {
        await authPG.deleteSession(token);
        return res.status(200).json({ success: true });
      } else if (driver === 'mysql') {
        await authMySQL.deleteSession(token);
        return res.status(200).json({ success: true });
      } else {
        // File storage fallback
        const sessions = loadSessionsFile();
        if (sessions[token]) {
          delete sessions[token];
          saveSessionsFile(sessions);
        }
        return res.status(200).json({ success: true });
      }
    }

    // GET USERS (admin only)
    if (action === 'users' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      const token = authHeader?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (driver === 'mongo') {
        const authMongo = require('../_auth_mongo');
        const session = await authMongo.verifySession(token);
        if (!session || session.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        const users = await authMongo.getAllUsers();
        return res.status(200).json({ success: true, users });
      } else if (driver === 'postgres') {
        const session = await authPG.verifySession(token);
        if (!session || session.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        const users = await (await pgDb.getPool()) ? require('../_auth_pg').getAllUsers() : [];
        return res.status(200).json({ success: true, users });
      } else if (driver === 'mysql') {
        const session = await authMySQL.verifySession(token);
        if (!session || session.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }
        const users = await authMySQL.getAllUsers();
        return res.status(200).json({ success: true, users });
      } else {
        // File storage fallback
        const sessions = loadSessionsFile();
        const session = sessions[token];
        
        if (!session || session.role !== 'admin') {
          return res.status(403).json({ error: 'Admin access required' });
        }

        const users = loadUsersFile();
        const userList = Object.values(users).map(u => ({
          email: u.email,
          name: u.name,
          role: u.role
        }));

        return res.status(200).json({
          success: true,
          users: userList
        });
      }
    }

    return res.status(404).json({ error: 'Not found' });

  } catch (error) {
    console.error('[Auth] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
