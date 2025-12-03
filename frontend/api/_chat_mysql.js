// MySQL-based chat helpers
const { getPool } = require('./_mysql');

// Save message to database
async function saveMessage(sessionId, sender, text) {
  const db = await getPool();
  if (!db) return null;
  
  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const isRead = sender === 'admin';
    
    await db.execute(
      'INSERT INTO messages (message_id, session_id, sender, text, `read`) VALUES (?, ?, ?, ?, ?)',
      [messageId, sessionId, sender, text, isRead]
    );
    
    // Get the inserted message
    const [rows] = await db.execute(
      'SELECT message_id as id, sender, text, created_at as createdAt, `read` FROM messages WHERE message_id = ?',
      [messageId]
    );
    
    console.log(`[Chat MySQL] ✅ Message saved: ${sessionId} (${sender})`);
    return rows[0];
  } catch (error) {
    console.error('[Chat MySQL] Error saving message:', error.message);
    return null;
  }
}

// Get messages for a session
async function getMessages(sessionId, limit = 100) {
  const db = await getPool();
  if (!db) return [];
  
  try {
    const [rows] = await db.execute(
      'SELECT message_id as id, sender, text, created_at as createdAt, `read` FROM messages WHERE session_id = ? ORDER BY created_at ASC LIMIT ?',
      [sessionId, Math.min(limit, 200)]
    );
    
    console.log(`[Chat MySQL] 📂 Retrieved ${rows.length} messages for ${sessionId}`);
    return rows;
  } catch (error) {
    console.error('[Chat MySQL] Error getting messages:', error.message);
    return [];
  }
}

// Get all conversations (list of sessions with last message)
async function getConversations() {
  const db = await getPool();
  if (!db) return [];
  
  try {
    const [rows] = await db.execute(`
      SELECT 
        m.session_id as sessionId,
        m.text as lastMessage,
        m.sender as lastSender,
        m.created_at as timestamp,
        (SELECT COUNT(*) FROM messages WHERE session_id = m.session_id AND sender = 'user' AND \`read\` = FALSE) as unread,
        (SELECT COUNT(*) FROM messages WHERE session_id = m.session_id) as messageCount
      FROM messages m
      INNER JOIN (
        SELECT session_id, MAX(created_at) as max_created
        FROM messages
        GROUP BY session_id
      ) latest ON m.session_id = latest.session_id AND m.created_at = latest.max_created
      ORDER BY m.created_at DESC
    `);
    
    console.log(`[Chat MySQL] 📋 Retrieved ${rows.length} conversations`);
    return rows;
  } catch (error) {
    console.error('[Chat MySQL] Error getting conversations:', error.message);
    return [];
  }
}

// Delete messages for a session
async function deleteMessages(sessionId) {
  const db = await getPool();
  if (!db) return false;
  
  try {
    if (sessionId) {
      await db.execute('DELETE FROM messages WHERE session_id = ?', [sessionId]);
      console.log(`[Chat MySQL] Deleted messages for ${sessionId}`);
    } else {
      await db.execute('DELETE FROM messages');
      console.log('[Chat MySQL] Deleted all messages');
    }
    return true;
  } catch (error) {
    console.error('[Chat MySQL] Error deleting messages:', error.message);
    return false;
  }
}

// Mark messages as read
async function markAsRead(sessionId) {
  const db = await getPool();
  if (!db) return false;
  
  try {
    await db.execute(
      'UPDATE messages SET `read` = TRUE WHERE session_id = ? AND sender = \'user\' AND `read` = FALSE',
      [sessionId]
    );
    console.log(`[Chat MySQL] Marked messages as read for ${sessionId}`);
    return true;
  } catch (error) {
    console.error('[Chat MySQL] Error marking messages as read:', error.message);
    return false;
  }
}

module.exports = {
  saveMessage,
  getMessages,
  getConversations,
  deleteMessages,
  markAsRead
};
