import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Fixing #N/A prices on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `${remotePath}/backend/fix_na_prices.js`;

    const scriptContent = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel } from './dist/models/index.js';

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  const allProducts = await ProductModel.find({}).select('_id price priceNum name').lean();
  const bulkOps = [];

  for (const p of allProducts) {
    const isNaString = typeof p.price === 'string' && (p.price.includes('#N/A') || p.price.includes('N/A') || p.price.includes('NaN') || p.price.includes('undefined'));
    const isInvalidNum = typeof p.priceNum !== 'number' || isNaN(p.priceNum);

    if (isNaString || isInvalidNum) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: {
            $set: {
              priceNum: 0,
              price: '0,000 DT'
            }
          }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(\`✅ Fixed \${bulkOps.length} products with #N/A or invalid prices -> set to 0,000 DT!\`);
  } else {
    console.log('✅ No products with #N/A or invalid prices found.');
  }

  await mongoose.disconnect();
}

run().catch(console.error);
    `;

    const writeStream = sftp.createWriteStream(remoteScript);
    writeStream.on('close', () => {
      console.log('Uploaded script to VPS. Executing...');
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node fix_na_prices.js
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
