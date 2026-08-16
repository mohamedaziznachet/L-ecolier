import { Client } from 'ssh2';

const conn = new Client();

const remoteCode = `
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const nullSubProducts = await productsColl.find({ 
    category: 'Fournitures scolaire', 
    $or: [{ subcategory: null }, { subcategory: { $exists: false } }, { subcategory: '' }] 
  }).project({ name: 1, brand: 1 }).toArray();

  console.log('Total null subcategory products:', nullSubProducts.length);
  console.log('Sample product names:');
  console.log(nullSubProducts.slice(0, 30).map(p => p.name));

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
    const ws = sftp.createWriteStream('/var/www/L-ecolier/backend/scripts/inspect_null_subs.js');
    ws.write(remoteCode);
    ws.end();
    ws.on('close', () => {
      conn.exec('export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"; cd /var/www/L-ecolier/backend; node scripts/inspect_null_subs.js', (err2, stream) => {
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
