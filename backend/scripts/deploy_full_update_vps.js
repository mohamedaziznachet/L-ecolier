import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const remotePath = '/var/www/L-ecolier';
const localFrontendDist = 'c:/Users/DELL/Desktop/librerie l\'ecolier/frontend/dist';
const remoteFrontendDist = `${remotePath}/frontend/dist`;

const conn = new Client();

function getAllFiles(dirPath, arrayOfFiles = []) {
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

function sftpMkdir(sftp, remoteDir) {
  return new Promise((resolve) => {
    sftp.mkdir(remoteDir, () => {
      resolve();
    });
  });
}

function sftpUploadFile(sftp, localPath, remotePath) {
  return new Promise((resolve, reject) => {
    sftp.fastPut(localPath, remotePath, (err) => {
      if (err) {
        const readStream = fs.createReadStream(localPath);
        const writeStream = sftp.createWriteStream(remotePath);
        writeStream.on('close', () => resolve());
        writeStream.on('error', (err2) => reject(err2));
        readStream.pipe(writeStream);
      } else {
        resolve();
      }
    });
  });
}

conn.on('ready', () => {
  console.log('✅ Connected via SSH to Hostinger VPS!');

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('❌ SFTP Init Error:', err);
      conn.end();
      return;
    }

    try {
      // 1. Upload Backend Changes
      console.log('📤 Uploading updated backend publicRoutes.ts...');
      await sftpUploadFile(
        sftp,
        'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/src/routes/publicRoutes.ts',
        `${remotePath}/backend/src/routes/publicRoutes.ts`
      );
      console.log('✅ Backend route file uploaded.');

      // 2. Upload Frontend Dist
      console.log('📂 Ensuring remote directories exist...');
      await sftpMkdir(sftp, `${remotePath}/frontend`);
      await sftpMkdir(sftp, remoteFrontendDist);
      await sftpMkdir(sftp, `${remoteFrontendDist}/assets`);

      const allLocalFiles = getAllFiles(localFrontendDist);
      console.log(`📦 Found ${allLocalFiles.length} frontend files to upload.`);

      let successCount = 0;
      for (let i = 0; i < allLocalFiles.length; i++) {
        const localFile = allLocalFiles[i];
        const relative = path.relative(localFrontendDist, localFile).replace(/\\/g, '/');
        const remoteFile = `${remoteFrontendDist}/${relative}`;

        process.stdout.write(`📤 [${i + 1}/${allLocalFiles.length}] Uploading ${relative}... `);
        try {
          await sftpUploadFile(sftp, localFile, remoteFile);
          process.stdout.write('OK\n');
          successCount++;
        } catch (e) {
          process.stdout.write(`FAILED: ${e.message}\n`);
        }
      }
      console.log(`\n🎉 Frontend upload complete: ${successCount}/${allLocalFiles.length} files transferred.`);

      // 3. Rebuild and restart backend on VPS
      console.log('🚀 Rebuilding & restarting backend on VPS...');
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
        if (err) {
          console.error('❌ Remote exec error:', err);
          conn.end();
          return;
        }

        let output = '';
        stream.on('close', (code) => {
          console.log(`✅ Backend rebuild and restart completed (exit code: ${code})`);
          console.log('Server process output:\n' + output);
          conn.end();
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          output += 'STDERR: ' + data;
        });
      });

    } catch (e) {
      console.error('❌ Deployment process error:', e);
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
