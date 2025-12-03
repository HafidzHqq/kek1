// MySQL connection helper with connection pooling
const mysql = require('mysql2/promise');

let pool = null;

async function getPool() {
  if (pool) return pool;
  
  const dbUrl = process.env.MYSQL_URL || process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.log('[MySQL] No DATABASE_URL configured, using file storage fallback');
    return null;
  }
  
  try {
    console.log('[MySQL] Creating connection pool...');
    
    // Parse MySQL URL: mysql://user:pass@host:port/database
    pool = mysql.createPool({
      uri: dbUrl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      timezone: 'Z' // UTC
    });
    
    // Test connection
    const connection = await pool.getConnection();
    console.log('[MySQL] ✅ Connection pool created successfully');
    connection.release();
    
    return pool;
  } catch (error) {
    console.error('[MySQL] ❌ Failed to create pool:', error.message);
    pool = null;
    return null;
  }
}

// Initialize database tables
async function initTables() {
  const db = await getPool();
  if (!db) return false;
  
  try {
    console.log('[MySQL] Initializing tables...');
    
    // Users table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_email (email),
        INDEX idx_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Sessions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL,
        token VARCHAR(500) NOT NULL,
        expires_at BIGINT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_session_id (session_id),
        INDEX idx_email (email),
        INDEX idx_token (token(255)),
        INDEX idx_expires (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Messages table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        message_id VARCHAR(255) NOT NULL UNIQUE,
        session_id VARCHAR(255) NOT NULL,
        sender VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`read\` BOOLEAN DEFAULT FALSE,
        INDEX idx_message_id (message_id),
        INDEX idx_session_id (session_id),
        INDEX idx_sender (sender),
        INDEX idx_created_at (created_at),
        INDEX idx_session_created (session_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('[MySQL] ✅ Tables initialized');
    return true;
  } catch (error) {
    console.error('[MySQL] ❌ Failed to initialize tables:', error.message);
    return false;
  }
}

// Cleanup expired sessions (maintenance)
async function cleanupExpiredSessions() {
  const db = await getPool();
  if (!db) return;
  
  try {
    const now = Date.now();
    const [result] = await db.execute(
      'DELETE FROM sessions WHERE expires_at < ?',
      [now]
    );
    if (result.affectedRows > 0) {
      console.log(`[MySQL] Cleaned up ${result.affectedRows} expired sessions`);
    }
  } catch (error) {
    console.error('[MySQL] Failed to cleanup sessions:', error.message);
  }
}

module.exports = { 
  getPool, 
  initTables,
  cleanupExpiredSessions
};
