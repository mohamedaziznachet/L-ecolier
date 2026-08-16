import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH to update MongoDB pageSettings on VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    cd ${remotePath}/backend
    export MONGODB_URI="mongodb://127.0.0.1:27017/lecolierer0"
    node -e "
      const mongoose = require('mongoose');
      mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0')
        .then(async () => {
          console.log('Connected to MongoDB');
          const db = mongoose.connection.db;
          const res = await db.collection('pagesettings').updateOne(
            { key: 'site_settings' },
            { \\$set: { 'content.shippingFee': '8' } }
          );
          console.log('Updated DB shippingFee:', res);
          process.exit(0);
        })
        .catch(err => { console.error(err); process.exit(1); });
    "
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log('Finished DB update with exit code:', code);
      console.log('Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}).on('error', (err) => {
  console.error('❌ SSH Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
