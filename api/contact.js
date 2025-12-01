let messages = [];

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    const { name, email, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Semua field harus diisi.' });
    }
    messages.push({ name, email, message, createdAt: new Date().toISOString() });
    return res.status(200).json({ message: 'Pesan diterima!' });
  }

  if (req.method === 'GET') {
    return res.status(200).json(messages);
  }

  return res.status(405).end();
}
