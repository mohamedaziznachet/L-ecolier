import { Client } from 'ssh2';

const conn = new Client();

const remoteCode = `
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  const prods = await productsColl.find({
    $or: [
      { name: /sb01/i },
      { name: /sb02/i },
      { 'specifications.value': /sb01/i },
      { 'specifications.value': /sb02/i }
    ]
  }).project({ id: 1, name: 1, description: 1, schoolLevel: 1, specifications: 1 }).toArray();

  console.log('=== TOUS LES PRODUITS SB01 & SB02 === (' + prods.length + ' articles)');
  prods.forEach(p => {
    console.log({
      _id: p._id,
      name: p.name,
      description: p.description,
      schoolLevel: p.schoolLevel,
      specifications: p.specifications
    });
  });

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
    const ws = sftp.createWriteStream('/var/www/L-ecolier/backend/scripts/inspect_sb_all.js');
    ws.write(remoteCode);
    ws.end();
    ws.on('close', () => {
      conn.exec('export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"; cd /var/www/L-ecolier/backend; node scripts/inspect_sb_all.js', (err2, stream) => {
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
