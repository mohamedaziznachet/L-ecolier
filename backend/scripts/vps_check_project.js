import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected! Checking /var/www/L-ecolier...');
  const cmd = `
    echo "=== /var/www/L-ecolier ==="
    ls -la /var/www/L-ecolier
    echo "=== Systemd services ==="
    systemctl list-units --type=service | grep -i ecolier || systemctl status ecolier || true
    echo "=== Nginx Config ==="
    cat /etc/nginx/sites-enabled/* || true
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}).on('error', (err) => {
  console.error('❌ Error:', err.message);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
