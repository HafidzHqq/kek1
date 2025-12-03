const { getPool } = require('./_pg');

async function saveMessage(sessionId, sender, text) {
  const db = await getPool();
  if (!db) return null;
  try {
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await db.query(
      'INSERT INTO messages (message_id, session_id, sender, text, read) VALUES ($1,$2,$3,$4,$5)',
      [messageId, sessionId, sender, text, sender === 'admin']
    );
    const { rows } = await db.query(
      'SELECT message_id as id, sender, text, created_at as "createdAt", read FROM messages WHERE message_id=$1',
      [messageId]
    );
    return rows[0];
  } catch (err) {
    console.error('[Chat PG] saveMessage error:', err.message);
    return null;
  }
}

async function getMessages(sessionId, limit = 100) {
  const db = await getPool();
  if (!db) return [];
  try {
    const { rows } = await db.query(
      'SELECT message_id as id, sender, text, created_at as "createdAt", read FROM messages WHERE session_id=$1 ORDER BY created_at ASC LIMIT $2',
      [sessionId, Math.min(limit, 200)]
    );
    return rows;
  } catch (err) {
    console.error('[Chat PG] getMessages error:', err.message);
    return [];
  }
}

async function getConversations() {
  const db = await getPool();
  if (!db) return [];
  try {
    const { rows } = await db.query(`
      SELECT m.session_id as "sessionId",
             m.text as "lastMessage",
             m.sender as "lastSender",
             m.created_at as timestamp,
             (SELECT COUNT(*) FROM messages WHERE session_id=m.session_id AND sender='user' AND read=false) as unread,
             (SELECT COUNT(*) FROM messages WHERE session_id=m.session_id) as "messageCount"
      FROM messages m
      JOIN (
        SELECT session_id, MAX(created_at) AS max_created
        FROM messages
        GROUP BY session_id
      ) latest ON m.session_id=latest.session_id AND m.created_at=latest.max_created
      ORDER BY m.created_at DESC
    `);
    return rows;
  } catch (err) {
    console.error('[Chat PG] getConversations error:', err.message);
    return [];
  }
}

async function deleteMessages(sessionId) {
  const db = await getPool();
  if (!db) return false;
  try {
    if (sessionId) await db.query('DELETE FROM messages WHERE session_id=$1', [sessionId]);
    else await db.query('DELETE FROM messages');
    return true;
  } catch (err) {
    console.error('[Chat PG] deleteMessages error:', err.message);
    return false;
  }
}

async function markAsRead(sessionId) {
  const db = await getPool();
  if (!db) return false;
  try {
    await db.query("UPDATE messages SET read=true WHERE session_id=$1 AND sender='user' AND read=false", [sessionId]);
    return true;
  } catch (err) {
    console.error('[Chat PG] markAsRead error:', err.message);
    return false;
  }
}

module.exports = { saveMessage, getMessages, getConversations, deleteMessages, markAsRead };
