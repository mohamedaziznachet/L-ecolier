import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Uploading clean_duplicates_and_no_images.js to VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut(
      'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/clean_duplicates_and_no_images.js',
      '/var/www/L-ecolier/backend/scripts/clean_duplicates_and_no_images.js',
      (err) => {
        if (err) throw err;
        console.log('Uploaded! Running cleanup on Hostinger VPS...');
        const cmd = `
          export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
          cd /var/www/L-ecolier/backend
          export MONGODB_URI="mongodb://127.0.0.1:27017/lecolierer0"
          node scripts/clean_duplicates_and_no_images.js
          node export_data.js
        `;
        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          let output = '';
          stream.on('close', (code) => {
            console.log('VPS Cleanup Output:\n' + output);
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
