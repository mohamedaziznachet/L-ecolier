import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH to remove CV_Mohamed_Aziz_Nachet.html from VPS...');
  const cmd = `rm -f /var/www/L-ecolier/CV_Mohamed_Aziz_Nachet.html`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('✅ File CV_Mohamed_Aziz_Nachet.html removed from VPS with code:', code);
      conn.end();
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
