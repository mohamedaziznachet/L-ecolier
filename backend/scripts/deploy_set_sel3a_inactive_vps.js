import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Setting sel3a products to inactive on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const localFile = 'c:/Users/DELL/Desktop/librerie l\'ecolier/backend/scratch/set_sel3a_inactive.js';
    const remoteFile = `${remotePath}/backend/set_sel3a_inactive.js`;

    // Adjust import for VPS backend root
    const scriptContent = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel } from './dist/models/index.js';

const barcodesFromPdf = [
  "3154149535118", "3154143534100", "3154143522114", "3154143927100", "3154145404005", "3154143526112", "3154142585004", "3154148502111",
  "3154148454205", "3154141194184", "3154144642170", "3154144642125", "3154144649148", "6920000194810", "3154144683104", "3154144649124",
  "3154144643122", "3154144720120", "3411037474790", "3411037472796", "3411037471799", "3154141916113", "3154141975127", "3154141926112",
  "3154141194108", "3154141961014", "3154145369533", "3154141915116", "3154141194306", "3154141961007", "3154141194054", "3154141941023",
  "3154141951107", "3154145181104", "3154141832246", "3154148518136", "3154148517603", "3154148540212", "3154148500230", "3154148518129",
  "3154148610113", "3154148325017", "3154148500216", "3154140182113", "3154142424211", "3154142426215", "3154142794109", "3154142444219",
  "3154142551108", "3154145604306", "3154148454694", "3154148457237", "3154148115205", "G010", "3154141195112", "3154145110104",
  "3154145120004", "3154140113001", "3154141161155", "3154141130502", "3154145113204", "3154140116002", "3154141205118", "3154145117905",
  "3154141067112", "3154148105107", "3154148105206", "3154148105404", "3154149817221", "3154146565101", "3154148457244", "3154148454007",
  "3154148454014", "3154148457206", "3154148950240", "3154142440693", "3154148971580", "3154142428158", "3154142428301", "3154142443045",
  "3154148454427", "3154142244048", "3154142428202", "3154148950554", "3154145599114", "3154145599305", "3154145640304", "3154145640366",
  "3154145595369", "3154142441805", "3154142440600", "3154142791153", "3154141461125", "3154142789105", "3154142797100", "3154142440204",
  "3154141465079", "3154142791108", "3154141465109", "3154141461149", "3154142420206", "3154142454102", "3154142792105", "3154142420305",
  "3154140631116", "3154145063004", "3154140714505", "3154140714109", "3154140625115", "3154140630119", "3154142776204", "3154142586087",
  "3154142786104"
];

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  const result = await ProductModel.updateMany(
    {
      $or: [
        { barcode: { $in: barcodesFromPdf } },
        { brand: 'Maped' }
      ]
    },
    {
      $set: {
        status: 'inactive'
      }
    }
  );

  console.log(\`✅ Updated \${result.modifiedCount} sel3a products to status: 'inactive'!\`);
  await mongoose.disconnect();
}

run().catch(console.error);
    `;

    const writeStream = sftp.createWriteStream(remoteFile);
    writeStream.on('close', () => {
      console.log('Uploaded script to VPS. Executing...');
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node set_sel3a_inactive.js
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
    writeStream.write(scriptContent);
    writeStream.end();
  });
}).on('error', (err) => {
  console.error('Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
