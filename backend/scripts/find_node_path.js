import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Searching for node and npm binary paths on VPS...');
  const cmd = `
    export PATH=$PATH:/usr/local/bin:~/.nvm/versions/node/$(ls ~/.nvm/versions/node 2>/dev/null | tail -n 1)/bin
    which node || find / -name node -type f 2>/dev/null
    which npm || find / -name npm -type f 2>/dev/null
    echo "PATH IS: $PATH"
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('Output:\n' + output);
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
