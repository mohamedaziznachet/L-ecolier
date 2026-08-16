import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Executing clear_sel3a_images on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scratch/clear_sel3a_images.js';
    const remoteFile = `${remotePath}/backend/clear_sel3a_images.js`;

    sftp.fastPut(localFile, remoteFile, (err) => {
      if (err) {
        console.error('Failed to upload script:', err);
        conn.end();
        return;
      }
      console.log('Uploaded script to VPS. Executing...');
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node clear_sel3a_images.js
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', (code) => {
          console.log('Finished VPS execution with code:', code);
          console.log('Output:\n' + output);
          conn.end();
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          output += 'STDERR: ' + data;
        });
      });
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
