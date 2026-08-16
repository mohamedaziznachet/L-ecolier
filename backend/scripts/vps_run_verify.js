import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Uploading verify_post_import.js to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut(
      'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/verify_post_import.js',
      '/var/www/L-ecolier/backend/scripts/verify_post_import.js',
      (err) => {
        if (err) throw err;
        console.log('Uploaded! Running verification on VPS...');
        const cmd = `
          export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
          cd /var/www/L-ecolier/backend
          node scripts/verify_post_import.js
        `;
        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          let output = '';
          stream.on('close', () => {
            console.log('VPS Verification Output:\n' + output);
            conn.end();
          }).on('data', (data) => {
            output += data;
          }).stderr.on('data', (data) => {
            output += 'STDERR: ' + data;
          });
        });
      }
    );
  });
}).on('error', (err) => {
  console.error('Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
