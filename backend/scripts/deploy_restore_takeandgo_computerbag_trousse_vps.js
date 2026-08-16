import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

const scriptJs = `
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log('Connected to MongoDB!');

  const products = await ProductModel.find({}).select('_id name description category').lean();
  const bulkOps = [];

  let takeAndGoCount = 0;
  let informatiqueCount = 0;
  let trousseCount = 0;

  for (const p of products) {
    const fullText = \`\${(p.name || '')} \${(p.description || '')} \${(p.category || '')}\`.toUpperCase();
    let newCat = null;

    if (fullText.includes('TAKE AND GO') || fullText.includes('TAKE & GO') || fullText.includes('TAKE-AND-GO')) {
      newCat = 'Take And Go';
      takeAndGoCount++;
    } else if (fullText.includes('INFORMATIQUE') || fullText.includes('LAPTOP') || fullText.includes('SAC A DOS INFORMATIQUE')) {
      newCat = 'Sac A Dos Informatique';
      informatiqueCount++;
    } else if (fullText.includes('TROUSSE') || fullText.includes('TR0') || fullText.includes('PLUMIER')) {
      newCat = 'Trousse';
      trousseCount++;
    }

    if (newCat && p.category !== newCat) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { category: newCat } }
        }
      });
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(\`✅ Updated \${bulkOps.length} products to target categories!\`);
    console.log(\`   • Take And Go: \${takeAndGoCount}\`);
    console.log(\`   • Sac A Dos Informatique: \${informatiqueCount}\`);
    console.log(\`   • Trousse: \${trousseCount}\`);
  } else {
    console.log('ℹ️ Products already matched target categories.');
  }

  // Re-sync CategoryModel and PageSettings categories list
  const distinctCats = (await ProductModel.distinct('category')).filter(Boolean).map(c => c.trim()).sort();
  
  await CategoryModel.deleteMany({});
  for (const catName of distinctCats) {
    await CategoryModel.create({ name: catName, image: '' });
  }

  await PageSettingsModel.findOneAndUpdate(
    { key: 'categories' },
    { key: 'categories', content: distinctCats },
    { returnDocument: 'after', upsert: true }
  );

  console.log(\`✅ Updated distinct categories (\${distinctCats.length}):\`, distinctCats);
  await mongoose.disconnect();
}

run().catch(err => { console.error(err); process.exit(1); });
`;

conn.on('ready', () => {
  console.log('✅ Connected via SSH! Uploading and executing category restoration script on Hostinger VPS...');
  conn.sftp((err, sftp) => {
    if (err) throw err;

    const remoteScript = `${remotePath}/backend/restore_categories.js`;
    const writeStream = sftp.createWriteStream(remoteScript);
    writeStream.on('close', () => {
      console.log('Uploaded restore_categories.js to VPS. Executing...');
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node restore_categories.js
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
    writeStream.write(scriptJs);
    writeStream.end();
  });
}).on('error', (err) => {
  console.error('SSH Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
