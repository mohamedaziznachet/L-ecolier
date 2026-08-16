import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Checking running node process on VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    ps aux | grep node
    curl -I http://127.0.0.1:4000/api/categories || true
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('VPS Backend Check:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
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
