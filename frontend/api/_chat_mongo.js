const { getDb } = require('./_mongo');

async function saveMessage(sessionId, sender, text) {
  const db = await getDb();
  if (!db) return null;
  try {
    const doc = { sessionId, sender, text, createdAt: new Date().toISOString(), read: sender === 'admin' };
    const res = await db.collection('messages').insertOne(doc);
    return { id: String(res.insertedId), ...doc };
  } catch (err) {
    console.error('[Chat Mongo] saveMessage error:', err.message);
    return null;
  }
}

async function getMessages(sessionId) {
  const db = await getDb();
  if (!db) return [];
  try {
    const rows = await db.collection('messages').find({ sessionId }).sort({ createdAt: 1 }).toArray();
    return rows.map(r => ({ id: String(r._id), sessionId: r.sessionId, sender: r.sender, text: r.text, createdAt: r.createdAt }));
  } catch (err) {
    console.error('[Chat Mongo] getMessages error:', err.message);
    return [];
  }
}

async function getConversations() {
  const db = await getDb();
  if (!db) return [];
  try {
    const pipeline = [
      { $sort: { createdAt: 1 } },
      { $group: {
          _id: '$sessionId',
          lastMessage: { $last: '$text' },
          lastSender: { $last: '$sender' },
          timestamp: { $last: '$createdAt' },
          messageCount: { $sum: 1 },
        }
      },
      { $project: {
          _id: 0,
          sessionId: '$_id',
          lastMessage: 1,
          lastSender: 1,
          timestamp: 1,
          messageCount: 1,
          unread: { $literal: 0 }
        }
      },
      { $sort: { timestamp: -1 } }
    ];
    return await db.collection('messages').aggregate(pipeline).toArray();
  } catch (err) {
    console.error('[Chat Mongo] getConversations error:', err.message);
    return [];
  }
}

async function deleteMessages(sessionId = null) {
  const db = await getDb();
  if (!db) return false;
  try {
    if (sessionId) {
      await db.collection('messages').deleteMany({ sessionId });
    } else {
      await db.collection('messages').deleteMany({});
    }
    return true;
  } catch (err) {
    console.error('[Chat Mongo] deleteMessages error:', err.message);
    return false;
  }
}

module.exports = { saveMessage, getMessages, getConversations, deleteMessages };
