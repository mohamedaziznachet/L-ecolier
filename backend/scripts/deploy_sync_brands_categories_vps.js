import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Syncing & normalizing brands and categories on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `${remotePath}/backend/sync_brands_categories.js`;

    const scriptContent = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, BrandModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

const BRAND_MAP = {
  'jovi': 'JOVI',
  'uhu': 'UHU',
  'MAPED': 'Maped',
  'maped': 'Maped',
  'KRISH X7': 'FLAIR',
  'TRIBALL PENSEN': 'FLAIR',
  'PORTE FOLIO': 'Générique',
  'MY-TECH': 'Générique'
};

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(\`Connected to MongoDB at \${uri}!\`);

  // 1. Normalize product brand names
  for (const [oldB, newB] of Object.entries(BRAND_MAP)) {
    const res = await ProductModel.updateMany({ brand: oldB }, { $set: { brand: newB } });
    if (res.modifiedCount > 0) {
      console.log(\`Normalized \${res.modifiedCount} products from brand '\${oldB}' to '\${newB}'\`);
    }
  }

  // 2. Re-sync BrandModel collection
  await BrandModel.deleteMany({});
  const distinctBrands = (await ProductModel.distinct('brand')).filter(Boolean).map(b => b.trim());
  const sortedBrands = Array.from(new Set(distinctBrands)).sort();

  for (const bName of sortedBrands) {
    await BrandModel.create({
      name: bName,
      logo: '',
      description: \`Marque \${bName}\`
    });
  }
  console.log(\`Updated BrandModel collection with \${sortedBrands.length} clean brands:\`, sortedBrands);

  // 3. Re-sync CategoryModel collection & PageSettings
  await CategoryModel.deleteMany({});
  const distinctCats = (await ProductModel.distinct('category')).filter(Boolean).map(c => c.trim());
  const sortedCats = Array.from(new Set(distinctCats)).sort();

  for (const cName of sortedCats) {
    await CategoryModel.create({
      name: cName,
      image: ''
    });
  }

  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: sortedCats },
    { returnDocument: 'after', upsert: true }
  );

  console.log(\`Updated CategoryModel collection & pageSettings with \${sortedCats.length} clean categories!\`);

  await mongoose.disconnect();
}

run().catch(console.error);
    `;

    const writeStream = sftp.createWriteStream(remoteScript);
    writeStream.on('close', () => {
      console.log('Uploaded sync script to VPS. Executing...');
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node sync_brands_categories.js
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
