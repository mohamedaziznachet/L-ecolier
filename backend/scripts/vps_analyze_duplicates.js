import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Running duplicate analysis on VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    export MONGODB_URI="mongodb://127.0.0.1:27017/lecolierer0"
    node -e "
      import mongoose from 'mongoose';

      function hasImage(p) {
        if (p.img && typeof p.img === 'string' && p.img.trim() !== '') return true;
        if (p.images && Array.isArray(p.images) && p.images.length > 0 && p.images.some(img => img && img.trim() !== '')) return true;
        return false;
      }

      function normalize(str) {
        if (!str) return '';
        return String(str).trim().toLowerCase().replace(/[\s\-_]/g, '');
      }

      async function run() {
        await mongoose.connect(process.env.MONGODB_URI);
        const db = mongoose.connection.db;
        const productsColl = db.collection('products');
        const products = await productsColl.find({}).toArray();

        console.log('Total Products on VPS:', products.length);

        const withoutImg = products.filter(p => !hasImage(p));
        console.log('Products without image on VPS:', withoutImg.length);

        // Group by name / spec ref / spec description
        const nameMap = new Map();
        products.forEach(p => {
          const keys = new Set();
          keys.add(normalize(p.name));
          if (p.specifications && Array.isArray(p.specifications)) {
            p.specifications.forEach(s => {
              if (s.value) keys.add(normalize(s.value));
            });
          }

          keys.forEach(k => {
            if (!k) return;
            if (!nameMap.has(k)) nameMap.set(k, new Set());
            nameMap.get(k).add(p._id.toString());
          });
        });

        // Find duplicate clusters
        const duplicateClusters = [];
        nameMap.forEach((idsSet, key) => {
          if (idsSet.size > 1) {
            duplicateClusters.push({ key, ids: Array.from(idsSet) });
          }
        });

        console.log('Duplicate clusters on VPS:', duplicateClusters.length);
        console.log('Sample duplicate clusters (first 10):', duplicateClusters.slice(0, 10));

        await mongoose.disconnect();
      }
      run();
    "
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('VPS Duplicate Analysis Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}).on('error', (err) => {
  console.error('Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
