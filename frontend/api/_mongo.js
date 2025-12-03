const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || process.env.MONGO_DB || 'app_db';

async function getClient() {
  try {
    if (!MONGODB_URI) return null;
    if (client && client.topology && client.topology.isConnected && client.topology.isConnected()) return client;
    if (client && client.isConnected && client.isConnected()) return client;
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 5,
      retryWrites: true,
    });
    await client.connect();
    console.log('[Mongo] ✅ Connected');
    return client;
  } catch (err) {
    console.error('[Mongo] Connection error:', err.message);
    return null;
  }
}

async function getDb() {
  const c = await getClient();
  if (!c) return null;
  if (!db) {
    db = c.db(MONGODB_DB_NAME);
  }
  return db;
}

async function initCollections() {
  const database = await getDb();
  if (!database) return false;
  try {
    const users = database.collection('users');
    const sessions = database.collection('sessions');
    const messages = database.collection('messages');

    await users.createIndex({ email: 1 }, { unique: true });
    await sessions.createIndex({ token: 1 }, { unique: true });
    await sessions.createIndex({ email: 1, expiresAt: 1 });
    await messages.createIndex({ sessionId: 1, createdAt: 1 });
    await messages.createIndex({ createdAt: 1 });

    console.log('[Mongo] ✅ Collections initialized');
    return true;
  } catch (err) {
    console.error('[Mongo] init error:', err.message);
    return false;
  }
}

async function cleanupExpiredSessions() {
  try {
    const database = await getDb();
    if (!database) return 0;
    const sessions = database.collection('sessions');
    const res = await sessions.deleteMany({ expiresAt: { $lt: Date.now() } });
    if (res?.deletedCount) console.log(`[Mongo] 🧹 Cleaned ${res.deletedCount} expired sessions`);
    return res?.deletedCount || 0;
  } catch (err) {
    console.error('[Mongo] cleanup error:', err.message);
    return 0;
  }
}

module.exports = { getClient, getDb, initCollections, cleanupExpiredSessions };
