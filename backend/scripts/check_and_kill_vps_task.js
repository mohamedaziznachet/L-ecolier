import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Checking running processes on Hostinger VPS...');
  const cmd = `
    pkill -f "fill_maped_barcodes_and_images" || true
    rm -f ${remotePath}/backend/fill_maped_barcodes_and_images.js
    ps aux | grep node
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log('VPS Process Status:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
