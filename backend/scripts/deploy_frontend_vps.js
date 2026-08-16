import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const remoteBasePath = '/var/www/L-ecolier/frontend/dist';
const localBasePath = 'c:/Users/DELL/Desktop/librerie l\'ecolier/frontend/dist';

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
      // Ignore error if already exists
      resolve();
    });
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

conn.on('ready', () => {
  console.log('✅ Connected via SSH to Hostinger VPS!');

  conn.sftp(async (err, sftp) => {
    if (err) {
      console.error('❌ SFTP Init Error:', err);
      conn.end();
      return;
    }

    try {
      console.log('📂 Ensuring remote directories exist...');
      await sftpMkdir(sftp, '/var/www/L-ecolier/frontend');
      await sftpMkdir(sftp, remoteBasePath);
      await sftpMkdir(sftp, `${remoteBasePath}/assets`);

      const allLocalFiles = getAllFiles(localBasePath);
      console.log(`📦 Found ${allLocalFiles.length} files to upload.`);

      let successCount = 0;
      for (let i = 0; i < allLocalFiles.length; i++) {
        const localFile = allLocalFiles[i];
        const relative = path.relative(localBasePath, localFile).replace(/\\/g, '/');
        const remoteFile = `${remoteBasePath}/${relative}`;

        process.stdout.write(`📤 [${i + 1}/${allLocalFiles.length}] Uploading ${relative}... `);
        try {
          await sftpUploadFile(sftp, localFile, remoteFile);
          process.stdout.write('OK\n');
          successCount++;
        } catch (e) {
          process.stdout.write(`FAILED: ${e.message}\n`);
        }
      }

      console.log(`\n🎉 Deployment complete! ${successCount}/${allLocalFiles.length} files uploaded successfully.`);
    } catch (e) {
      console.error('❌ Upload process failed:', e);
    } finally {
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
