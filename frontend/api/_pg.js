// PostgreSQL connection helper with pooling
const { Pool } = require('pg');

let pool = null;

function shouldUsePostgres() {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL || '';
  return /^postgres(ql)?:\/\//i.test(url);
}

async function getPool() {
  if (!shouldUsePostgres()) return null;
  if (pool) return pool;

  const connStr = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!connStr) return null;

  try {
    pool = new Pool({ connectionString: connStr, max: 10, idleTimeoutMillis: 30000 });
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('[Postgres] ✅ Connection pool ready');
    return pool;
  } catch (err) {
    console.error('[Postgres] ❌ Failed to connect:', err.message);
    pool = null;
    return null;
  }
}

async function initTables() {
  const db = await getPool();
  if (!db) return false;
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) NOT NULL,
        token TEXT NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_email ON sessions(email);
      CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
      CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    `);

    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(255) UNIQUE NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read BOOLEAN DEFAULT FALSE
      );
      CREATE INDEX IF NOT EXISTS idx_messages_message_id ON messages(message_id);
      CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_session_created ON messages(session_id, created_at);
    `);

    console.log('[Postgres] ✅ Tables initialized');
    return true;
  } catch (err) {
    console.error('[Postgres] ❌ Init tables failed:', err.message);
    return false;
  }
}

async function cleanupExpiredSessions() {
  const db = await getPool();
  if (!db) return;
  try {
    const now = Date.now();
    const result = await db.query('DELETE FROM sessions WHERE expires_at < $1', [now]);
    if (result.rowCount > 0) console.log(`[Postgres] Cleaned ${result.rowCount} expired sessions`);
  } catch (err) {
    console.error('[Postgres] Cleanup failed:', err.message);
  }
}

module.exports = { getPool, initTables, cleanupExpiredSessions, shouldUsePostgres };
