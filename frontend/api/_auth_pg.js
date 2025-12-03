const { getPool } = require('./_pg');
const crypto = require('crypto');

const ADMIN_EMAIL = 'gegefans0@gmail.com';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getUser(email) {
  const db = await getPool();
  if (!db) return null;
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    return rows[0] || null;
  } catch (err) {
    console.error('[Auth PG] getUser error:', err.message);
    return null;
  }
}

async function createUser(email, password, name = '', role = 'user') {
  const db = await getPool();
  if (!db) return null;
  try {
    const hashed = hashPassword(password);
    const { rows } = await db.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1,$2,$3,$4) RETURNING id,email,name,role',
      [email, hashed, name, role]
    );
    console.log(`[Auth PG] User created ${email}`);
    return rows[0];
  } catch (err) {
    if (err.code === '23505') {
      console.log(`[Auth PG] User exists ${email}`);
      return null;
    }
    console.error('[Auth PG] createUser error:', err.message);
    return null;
  }
}

async function verifyUser(email, password) {
  const user = await getUser(email);
  if (!user) return null;
  const hashed = hashPassword(password);
  if (user.password !== hashed) return null;
  return { email: user.email, name: user.name, role: user.role };
}

async function createSession(email, role = 'user') {
  const db = await getPool();
  if (!db) return null;
  try {
    const token = generateToken();
    const sessionId = `email_${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await db.query('DELETE FROM sessions WHERE email = $1', [email]);
    await db.query(
      'INSERT INTO sessions (session_id, email, token, expires_at) VALUES ($1,$2,$3,$4)',
      [sessionId, email, token, expiresAt]
    );
    return { token, sessionId, email, role, expiresAt };
  } catch (err) {
    console.error('[Auth PG] createSession error:', err.message);
    return null;
  }
}

async function verifySession(token) {
  const db = await getPool();
  if (!db) return null;
  try {
    const { rows } = await db.query(
      'SELECT s.*, u.role FROM sessions s JOIN users u ON s.email=u.email WHERE s.token=$1 AND s.expires_at > $2',
      [token, Date.now()]
    );
    const s = rows[0];
    if (!s) return null;
    return { email: s.email, sessionId: s.session_id, role: s.role, expiresAt: s.expires_at };
  } catch (err) {
    console.error('[Auth PG] verifySession error:', err.message);
    return null;
  }
}

async function getAllUsers() {
  const db = await getPool();
  if (!db) return [];
  try {
    const { rows } = await db.query('SELECT id,email,name,role,created_at FROM users ORDER BY created_at DESC');
    return rows;
  } catch (err) {
    console.error('[Auth PG] getAllUsers error:', err.message);
    return [];
  }
}

async function deleteSession(token) {
  const db = await getPool();
  if (!db) return false;
  try {
    await db.query('DELETE FROM sessions WHERE token=$1', [token]);
    return true;
  } catch (err) {
    console.error('[Auth PG] deleteSession error:', err.message);
    return false;
  }
}

module.exports = { ADMIN_EMAIL, hashPassword, getUser, createUser, verifyUser, createSession, verifySession, getAllUsers, deleteSession };
