import { Client } from 'ssh2';

const conn = new Client();

const remoteCode = `
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const subs = await productsColl.aggregate([
    { $match: { category: 'Fournitures scolaire' } },
    { $group: { _id: '$subcategory', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();

  console.log('=== SOUS-CATEGORIES DANS "Fournitures scolaire" (MONGODB) ===');
  console.log(JSON.stringify(subs, null, 2));

  // Also get some sample product names
  const samples = await productsColl.find({ category: 'Fournitures scolaire' }).limit(10).project({ name: 1, subcategory: 1, brand: 1 }).toArray();
  console.log('\\n=== EXEMPLES D ARTICLES ===');
  console.log(JSON.stringify(samples, null, 2));

  await mongoose.disconnect();
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    const ws = sftp.createWriteStream('/var/www/L-ecolier/backend/scripts/inspect_remote.js');
    ws.write(remoteCode);
    ws.end();
    ws.on('close', () => {
      conn.exec('export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"; cd /var/www/L-ecolier/backend; node scripts/inspect_remote.js', (err2, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += 'ERR: ' + d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).on('error', console.error).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
