let messages = [];

export default function handler(req, res) {
  if (req.method === 'POST') {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Semua field harus diisi.' });
    }
    messages.push({ name, email, message, createdAt: new Date() });
    res.status(200).json({ message: 'Pesan diterima!' });
  } else if (req.method === 'GET') {
    res.status(200).json(messages);
  } else {
    res.status(405).end();
  }
}
