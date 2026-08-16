import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const remoteBasePath = '/var/www/L-ecolier';
const localFrontendDist = 'c:/Users/DELL/Desktop/librerie l\'ecolier/frontend/dist';
const localBackendDir = 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend';

const conn = new Client();

function getAllFiles(dirPath, arrayOfFiles = []) {
  if (!fs.existsSync(dirPath)) return arrayOfFiles;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
    } else {
      arrayOfFiles.push(fullPath);
    }
  });

  return arrayOfFiles;
}

function sftpMkdirRecursive(sftp, remoteDir) {
  return new Promise((resolve) => {
    const parts = remoteDir.split('/').filter(Boolean);
    let current = '';
    
    function mkdirNext(idx) {
      if (idx >= parts.length) return resolve();
      current += '/' + parts[idx];
      sftp.mkdir(current, () => {
        mkdirNext(idx + 1);
      });
    }
    
    mkdirNext(0);
  });
}

function sftpUploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(localPath);
    const writeStream = sftp.createWriteStream(remotePath);
    writeStream.on('close', () => resolve());
    writeStream.on('error', (err) => reject(err));
    readStream.on('error', (err) => reject(err));
    readStream.pipe(writeStream);
  });
}

async function uploadDirectory(sftp, localDir, remoteDir, label) {
  console.log(`\n📦 Gathering files for ${label}...`);
  const allFiles = getAllFiles(localDir);
  console.log(`Found ${allFiles.length} files to upload.`);

  // Find all unique directories that need to exist
  const uniqueDirs = new Set();
  allFiles.forEach(file => {
    const rel = path.relative(localDir, file).replace(/\\/g, '/');
    const remoteFilePath = `${remoteDir}/${rel}`;
    const remoteFileDir = path.dirname(remoteFilePath).replace(/\\/g, '/');
    uniqueDirs.add(remoteFileDir);
  });

  for (const dir of uniqueDirs) {
    await sftpMkdirRecursive(sftp, dir);
  }

  let count = 0;
  for (let i = 0; i < allFiles.length; i++) {
    const localFile = allFiles[i];
    const rel = path.relative(localDir, localFile).replace(/\\/g, '/');
    const remoteFile = `${remoteDir}/${rel}`;
    try {
      await sftpUploadFile(sftp, localFile, remoteFile);
      count++;
      if ((i + 1) % 15 === 0 || i === allFiles.length - 1) {
        console.log(`  [${i + 1}/${allFiles.length}] Uploaded ${rel}`);
      }
    } catch (err) {
      console.error(`  ❌ Failed uploading ${rel}:`, err.message);
    }
  }

  console.log(`✅ ${label}: ${count}/${allFiles.length} files successfully uploaded.`);
}

conn.on('ready', () => {
  console.log('✅ Connected via SSH to Hostinger VPS (69.62.115.32)!');

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('❌ SFTP Init Error:', err);
      conn.end();
      return;
    }

    try {
      // 1. Upload Frontend Dist
      await uploadDirectory(sftp, localFrontendDist, `${remoteBasePath}/frontend/dist`, 'Frontend (Production Build)');

      // 2. Upload Backend Dist
      await uploadDirectory(sftp, path.join(localBackendDir, 'dist'), `${remoteBasePath}/backend/dist`, 'Backend Dist');

      // 3. Upload Backend Src
      await uploadDirectory(sftp, path.join(localBackendDir, 'src'), `${remoteBasePath}/backend/src`, 'Backend Src');

      // 4. Upload Backend DB Backup
      await uploadDirectory(sftp, path.join(localBackendDir, 'db_backup'), `${remoteBasePath}/backend/db_backup`, 'Backend DB Backup');

      // 5. Upload Backend Package Files
      const pkgFiles = ['package.json', 'package-lock.json', 'tsconfig.json'];
      for (const pFile of pkgFiles) {
        const localP = path.join(localBackendDir, pFile);
        if (fs.existsSync(localP)) {
          await sftpUploadFile(sftp, localP, `${remoteBasePath}/backend/${pFile}`);
          console.log(`✅ Uploaded backend/${pFile}`);
        }
      }

      // 6. Execute Remote Build and Server Reload
      console.log('\n🚀 Triggering server restart & Nginx reload on VPS...');
      const commands = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remoteBasePath}/backend
        npm run build || tsc -p tsconfig.json
        pkill -f "node.*server.js" || pkill -f "node.*index.js" || pkill -f "node.*dist/server.js" || true
        nohup node dist/server.js > ${remoteBasePath}/backend/server.log 2>&1 &
        sleep 2
        nginx -t && systemctl reload nginx || true
        echo "=== PROCESS STATUS ==="
        ps aux | grep node | grep -v grep || true
        echo "=== NGINX STATUS ==="
        systemctl is-active nginx || true
        echo "=== RECENT SERVER LOGS ==="
        tail -n 20 ${remoteBasePath}/backend/server.log || true
      `;

      conn.exec(commands, (execErr, stream) => {
        if (execErr) {
          console.error('❌ Exec Error:', execErr);
          conn.end();
          return;
        }

        let output = '';
        stream.on('close', (code) => {
          console.log(`\n🎉 Remote execution finished with exit code ${code}`);
          console.log('--- VPS Output ---');
          console.log(output);
          console.log('------------------');
          conn.end();
        }).on('data', (d) => {
          output += d;
        }).stderr.on('data', (d) => {
          output += d;
        });
      });

    } catch (e) {
      console.error('❌ Deployment process failed:', e);
      conn.end();
    }
  });
}).on('error', (err) => {
  console.error('❌ SSH Connection Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
