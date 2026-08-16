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
  console.log('✅ Connected via SSH! Uploading frontend dist & backend files for subcategories to Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const frontendDist = 'c:/Users/DELL/Desktop/librerie l\'ecolier/frontend/dist';
    const remoteDist = `${remotePath}/frontend/dist`;

    console.log('Uploading frontend dist...');
    uploadDir(sftp, frontendDist, remoteDist, () => {
      console.log('✅ Frontend dist uploaded!');

      const filesToUpload = [
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/models/index.ts', remote: `${remotePath}/backend/src/models/index.ts` },
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/routes/publicRoutes.ts', remote: `${remotePath}/backend/src/routes/publicRoutes.ts` },
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/routes/adminRoutes.ts', remote: `${remotePath}/backend/src/routes/adminRoutes.ts` },
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/repositories/categoryRepository.ts', remote: `${remotePath}/backend/src/repositories/categoryRepository.ts` },
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/assign_subcategories_vps.js', remote: `${remotePath}/backend/scripts/assign_subcategories_vps.js` },
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/migrate_categories_to_subcategories.js', remote: `${remotePath}/backend/scripts/migrate_categories_to_subcategories.js` },
        { local: 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/deduplicate_categories_db.js', remote: `${remotePath}/backend/scripts/deduplicate_categories_db.js` },
      ];

      let uploadedCount = 0;
      filesToUpload.forEach(f => {
        sftp.fastPut(f.local, f.remote, (err) => {
          if (err) console.error(`Failed ${f.local}:`, err);
          else console.log(`Uploaded ${f.remote}`);
          uploadedCount++;
          if (uploadedCount === filesToUpload.length) {
            runVpsSubcategorySetup();
          }
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});

function runVpsSubcategorySetup() {
  console.log('🚀 Rebuilding backend & auto-assigning/migrating/deduplicating subcategories on Hostinger VPS...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    cd ${remotePath}/backend
    npm run build || tsc -p tsconfig.json
    node scripts/deduplicate_categories_db.js
    node scripts/assign_subcategories_vps.js
    node scripts/migrate_categories_to_subcategories.js
    pkill -f "node.*server.js" || pkill -f "node.*index.js" || true
    nohup node server.js > ${remotePath}/backend/server.log 2>&1 &
    sleep 2
    ps aux | grep node
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', (code) => {
      console.log('Finished VPS subcategory deployment with code:', code);
      console.log('Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    }).stderr.on('data', (data) => {
      output += 'STDERR: ' + data;
    });
  });
}
