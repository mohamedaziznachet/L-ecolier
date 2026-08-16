import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ SSH Client Ready & Connected!');
  conn.exec('ls -la /var/www/librerie-lecolier', (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code, signal) => {
      console.log('Command exited with code ' + code);
      console.log('Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      console.error('STDERR: ' + data);
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection error:', err.message);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
