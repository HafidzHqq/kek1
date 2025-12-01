let messages = [];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    return res.status(200).json(messages);
  }

  if (req.method === 'POST') {
    const { sender = 'user', text } = req.body || {};
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'text required' });
    }
    const msg = { sender, text, createdAt: new Date().toISOString() };
    messages.push(msg);
    return res.status(200).json(msg);
  }

  if (req.method === 'DELETE') {
    messages = [];
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}
