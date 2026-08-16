import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

function uploadDir(sftp, localDir, remoteDir, callback) {
  sftp.mkdir(remoteDir, () => {
    const files = fs.readdirSync(localDir);
    let count = 0;
    if (files.length === 0) return callback();

    files.forEach(file => {
      const localFilePath = path.join(localDir, file);
      const remoteFilePath = `${remoteDir}/${file}`;
      const stat = fs.statSync(localFilePath);

      if (stat.isDirectory()) {
        uploadDir(sftp, localFilePath, remoteFilePath, () => {
          count++;
          if (count === files.length) callback();
        });
      } else {
        sftp.fastPut(localFilePath, remoteFilePath, (err) => {
          if (err) console.error(`Error uploading ${localFilePath}:`, err);
          count++;
          if (count === files.length) callback();
        });
      }
    });
  });
}

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Deploying updated code to Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const frontendDist = 'c:/Users/DELL/Desktop/librerie l\'ecolier/frontend/dist';
    const remoteDist = `${remotePath}/frontend/dist`;

    console.log('Uploading compiled frontend dist...');
    uploadDir(sftp, frontendDist, remoteDist, () => {
      console.log('✅ Frontend dist uploaded!');
      uploadBackendFiles(sftp);
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

function uploadBackendFiles(sftp) {
  const files = [
    { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/middleware/admin2fa.ts', remote: `${remotePath}/backend/src/middleware/admin2fa.ts` },
    { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/repositories/productRepository.ts', remote: `${remotePath}/backend/src/repositories/productRepository.ts` },
    { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/repositories/couponRepository.ts', remote: `${remotePath}/backend/src/repositories/couponRepository.ts` },
    { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/routes/adminRoutes.ts', remote: `${remotePath}/backend/src/routes/adminRoutes.ts` },
    { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/routes/authRoutes.ts', remote: `${remotePath}/backend/src/routes/authRoutes.ts` },
    { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/routes/publicRoutes.ts', remote: `${remotePath}/backend/src/routes/publicRoutes.ts` },
  ];

  let done = 0;
  files.forEach(f => {
    sftp.fastPut(f.local, f.remote, (err) => {
      if (err) console.error(`Failed ${f.local}:`, err);
      else console.log(`Uploaded ${f.remote}`);
      done++;
      if (done === files.length) {
        restartBackendServer();
      }
    });
  });
}

function restartBackendServer() {
  console.log('🚀 Rebuilding & restarting backend on Hostinger VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    cd ${remotePath}/backend
    npm run build || tsc -p tsconfig.json
    pkill -f "node.*server.js" || pkill -f "node.*index.js" || true
    nohup node server.js > ${remotePath}/backend/server.log 2>&1 &
    sleep 2
    ps aux | grep node
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log('Finished restart with exit code:', code);
      console.log('Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}
