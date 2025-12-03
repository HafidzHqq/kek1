const mongoDb = require('./_mongo');
const pgDb = require('./_pg');
const { getPool } = require('./_mysql');

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let driver = 'file';
    const mongo = await mongoDb.getDb();
    if (mongo) driver = 'mongo';
    else {
      const pgPool = await pgDb.getPool();
      if (pgPool) driver = 'postgres';
      else if (await getPool()) driver = 'mysql';
    }

    return res.status(200).json({
      ok: true,
      driver,
      hasMongoUri: Boolean(process.env.MONGODB_URI || process.env.MONGODB_URL || process.env.DATABASE_URL),
      dbName: process.env.MONGODB_DB_NAME || 'app_db'
    });
  } catch (e) {
    return res.status(200).json({ ok: false, error: e.message });
  }
}
