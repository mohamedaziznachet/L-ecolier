import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Uploading remove_niveau_scolaire.js to Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;
    sftp.fastPut(
      'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/remove_niveau_scolaire.js',
      '/var/www/L-ecolier/backend/scripts/remove_niveau_scolaire.js',
      (err) => {
        if (err) throw err;
        console.log('Uploaded! Executing Niveau scolaire removal on Hostinger VPS...');
        const cmd = `
          export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
          cd /var/www/L-ecolier/backend
          export MONGODB_URI="mongodb://127.0.0.1:27017/lecolierer0"
          node scripts/remove_niveau_scolaire.js
          node export_data.js
        `;
        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          let output = '';
          stream.on('close', (code) => {
            console.log('VPS Output:\n' + output);
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
