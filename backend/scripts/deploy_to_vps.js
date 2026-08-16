import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const remotePath = '/var/www/L-ecolier';

const filesToUpload = [
  {
    local: 'C:/Users/DELL/Desktop/LISTE DES PRIX BOMI COLLECTION 2026.xlsx',
    remote: `${remotePath}/LISTE DES PRIX BOMI COLLECTION 2026.xlsx`
  },
  {
    local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/update_and_create_bomi_2026.js',
    remote: `${remotePath}/backend/scripts/update_and_create_bomi_2026.js`
  },
  {
    local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/db_backup/products.json',
    remote: `${remotePath}/backend/db_backup/products.json`
  }
];

const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Opening SFTP...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    let completed = 0;
    filesToUpload.forEach(file => {
      console.log(`Uploading ${file.local} -> ${file.remote}...`);
      sftp.fastPut(file.local, file.remote, (err) => {
        if (err) {
          console.error(`❌ Failed to upload ${file.local}:`, err);
        } else {
          console.log(`✅ Uploaded ${file.remote}`);
        }
        completed++;
        if (completed === filesToUpload.length) {
          runRemoteImport();
        }
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});

function runRemoteImport() {
  console.log('\n🚀 Running import & update script on VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    cd ${remotePath}/backend
    npm list xlsx || npm install xlsx
    export MONGODB_URI="mongodb://127.0.0.1:27017/lecolierer0"
    node scripts/update_and_create_bomi_2026.js
    node import_data.js
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log('Finished with exit code:', code);
      console.log('VPS Output:\n' + output);
      restartVpsServer();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}

function restartVpsServer() {
  console.log('\n🔄 Restarting Node backend server on VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    pkill -f "node.*server.js" || pkill -f "node.*index.js" || true
    cd ${remotePath}/backend
    nohup node server.js > ${remotePath}/backend/server.log 2>&1 &
    sleep 2
    ps aux | grep node
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('Restart Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    });
  });
}
