const crypto = require('crypto');
const { getDb } = require('./_mongo');

const ADMIN_EMAIL = 'gegefans0@gmail.com';

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

async function getUser(email) {
  const db = await getDb();
  if (!db) return null;
  try {
    return await db.collection('users').findOne({ email });
  } catch (err) {
    console.error('[Auth Mongo] getUser error:', err.message);
    return null;
  }
}

async function createUser(email, password, name = '', role = 'user') {
  const db = await getDb();
  if (!db) return null;
  try {
    const doc = { email, password: hashPassword(password), name, role, createdAt: Date.now() };
    await db.collection('users').insertOne(doc);
    console.log(`[Auth Mongo] User created ${email}`);
    return { email, name, role };
  } catch (err) {
    if (err.code === 11000) {
      console.log(`[Auth Mongo] User exists ${email}`);
      return null;
    }
    console.error('[Auth Mongo] createUser error:', err.message);
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
  const db = await getDb();
  if (!db) return null;
  try {
    const token = generateToken();
    const sessionId = `email_${email.replace(/@/g, '_at_').replace(/\./g, '_dot_')}`;
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    await db.collection('sessions').deleteMany({ email });
    await db.collection('sessions').insertOne({ sessionId, email, token, role, expiresAt, createdAt: Date.now() });
    return { token, sessionId, email, role, expiresAt };
  } catch (err) {
    console.error('[Auth Mongo] createSession error:', err.message);
    return null;
  }
}

async function verifySession(token) {
  const db = await getDb();
  if (!db) return null;
  try {
    const s = await db.collection('sessions').findOne({ token, expiresAt: { $gt: Date.now() } });
    if (!s) return null;
    return { email: s.email, sessionId: s.sessionId, role: s.role, expiresAt: s.expiresAt };
  } catch (err) {
    console.error('[Auth Mongo] verifySession error:', err.message);
    return null;
  }
}

async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.collection('users').find({}, { projection: { _id: 0, password: 0 } }).sort({ createdAt: -1 }).toArray();
    return rows.map(u => ({ email: u.email, name: u.name, role: u.role, createdAt: u.createdAt }));
  } catch (err) {
    console.error('[Auth Mongo] getAllUsers error:', err.message);
    return [];
  }
}

async function deleteSession(token) {
  const db = await getDb();
  if (!db) return false;
  try {
    const res = await db.collection('sessions').deleteOne({ token });
    return res?.deletedCount > 0;
  } catch (err) {
    console.error('[Auth Mongo] deleteSession error:', err.message);
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
};
