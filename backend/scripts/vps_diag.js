import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected! Running diagnostic commands...');
  const cmd = `
    echo "=== /var/www ==="
    ls -la /var/www || true
    echo "=== /opt ==="
    ls -la /opt || true
    echo "=== Docker Containers ==="
    docker ps || true
    echo "=== PM2 Status ==="
    pm2 status || true
    echo "=== Listening Ports ==="
    ss -tulpn || netstat -tulpn || true
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log('Diagnostic Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
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
