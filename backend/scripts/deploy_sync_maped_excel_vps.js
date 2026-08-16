import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Uploading MAPED site web.xlsx & sync_maped_excel_full.js to Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localExcel = 'C:/Users/DELL/Desktop/MAPED site web.xlsx';
    const remoteExcel = `${remotePath}/MAPED site web.xlsx`;
    const localScript = 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scripts/sync_maped_excel_full.js';
    const remoteScript = `${remotePath}/backend/scripts/sync_maped_excel_full.js`;

    console.log('Uploading MAPED site web.xlsx...');
    sftp.fastPut(localExcel, remoteExcel, (err) => {
      if (err) {
        console.error('Failed to upload Excel:', err);
        conn.end();
        return;
      }
      console.log('Uploaded Excel file! Uploading sync script...');
      sftp.fastPut(localScript, remoteScript, (err) => {
        if (err) {
          console.error('Failed to upload script:', err);
          conn.end();
          return;
        }
        console.log('Uploaded sync script! Running Maped products sync & green rows cleanup on VPS...');

        const cmd = `
          export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
          cd ${remotePath}/backend
          npm list exceljs || npm install exceljs
          node scripts/sync_maped_excel_full.js
        `;

        conn.exec(cmd, (err, stream) => {
          if (err) throw err;
          let output = '';
          stream.on('close', (code) => {
            console.log('Finished Maped sync execution with code:', code);
            console.log('Output:\n' + output);
            restartVpsServer();
          }).on('data', (data) => {
            output += data;
          }).stderr.on('data', (data) => {
            output += 'STDERR: ' + data;
          });
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

function restartVpsServer() {
  console.log('🔄 Restarting Node backend server on VPS...');
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
    stream.on('close', () => {
      console.log('Restart Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    });
  });
}
