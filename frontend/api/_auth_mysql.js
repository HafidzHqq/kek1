// MySQL-based authentication helpers
const { getPool, initTables } = require('./_mysql');
const crypto = require('crypto');

const ADMIN_EMAIL = 'gegefans0@gmail.com';

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate random token
function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Get user by email
async function getUser(email) {
  const db = await getPool();
  if (!db) return null;
  
  try {
    const [rows] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error('[Auth MySQL] Error getting user:', error.message);
    return null;
  }
}

// Create new user
async function createUser(email, password, name = '', role = 'user') {
  const db = await getPool();
  if (!db) return null;
  
  try {
    const hashedPassword = hashPassword(password);
    const [result] = await db.execute(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role]
    );
    
    console.log(`[Auth MySQL] ✅ User created: ${email} (${role})`);
    return {
      id: result.insertId,
      email,
      name,
      role
    };
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.log(`[Auth MySQL] User already exists: ${email}`);
      return null;
    }
    console.error('[Auth MySQL] Error creating user:', error.message);
    return null;
  }
}

// Verify user credentials
async function verifyUser(email, password) {
  const user = await getUser(email);
  if (!user) return null;
  
  const hashedPassword = hashPassword(password);
  if (user.password !== hashedPassword) return null;
  
  return {
    email: user.email,
    name: user.name,
    role: user.role
  };
}

// Create session
async function createSession(email, role = 'user') {
  const db = await getPool();
  if (!db) return null;
  
  try {
    const token = generateToken();
    const sessionId = `email_${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    
    // Delete old sessions for this user
    await db.execute(
      'DELETE FROM sessions WHERE email = ?',
      [email]
    );
    
    // Create new session
    await db.execute(
      'INSERT INTO sessions (session_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
      [sessionId, email, token, expiresAt]
    );
    
    console.log(`[Auth MySQL] ✅ Session created for ${email}`);
    return {
      token,
      sessionId,
      email,
      role,
      expiresAt
    };
  } catch (error) {
    console.error('[Auth MySQL] Error creating session:', error.message);
    return null;
  }
}

// Verify session token
async function verifySession(token) {
  const db = await getPool();
  if (!db) return null;
  
  try {
    const [rows] = await db.execute(
      'SELECT s.*, u.role FROM sessions s JOIN users u ON s.email = u.email WHERE s.token = ? AND s.expires_at > ?',
      [token, Date.now()]
    );
    
    if (rows.length === 0) return null;
    
    const session = rows[0];
    return {
      email: session.email,
      sessionId: session.session_id,
      role: session.role,
      expiresAt: session.expires_at
    };
  } catch (error) {
    console.error('[Auth MySQL] Error verifying session:', error.message);
    return null;
  }
}

// Get all users (admin only)
async function getAllUsers() {
  const db = await getPool();
  if (!db) return [];
  
  try {
    const [rows] = await db.execute(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
    );
    return rows;
  } catch (error) {
    console.error('[Auth MySQL] Error getting users:', error.message);
    return [];
  }
}

// Delete session
async function deleteSession(token) {
  const db = await getPool();
  if (!db) return false;
  
  try {
    await db.execute('DELETE FROM sessions WHERE token = ?', [token]);
    console.log('[Auth MySQL] Session deleted');
    return true;
  } catch (error) {
    console.error('[Auth MySQL] Error deleting session:', error.message);
    return false;
  }
}

module.exports = {
  ADMIN_EMAIL,
  hashPassword,
  getUser,
  createUser,
  verifyUser,
  createSession,
  verifySession,
  getAllUsers,
  deleteSession,
  initTables
};
