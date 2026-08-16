import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  const cmd = `[ -f /var/www/L-ecolier/CV_Mohamed_Aziz_Nachet.html ] && echo "EXISTS" || echo "DELETED"`;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('VPS Status:', output.trim());
      conn.end();
    }).on('data', (data) => {
      output += data;
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
