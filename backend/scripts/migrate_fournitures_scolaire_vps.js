import { Client } from 'ssh2';
import fs from 'fs';
import path from 'path';

const remotePath = '/var/www/L-ecolier';

const conn = new Client();

const remoteMigrationCode = `
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';

async function run() {
  console.log('Connecting to MongoDB on VPS:', MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const productsColl = db.collection('products');
  const categoriesColl = db.collection('categories');

  console.log('--- 1. Migrating Categories Collection ---');
  // Find all category variants matching "Fournitures Scolaires" / "Fournitures scolaires" / "Fournitures scolaire"
  const catRegex = /^fournitures\\s+scolaires?$/i;
  const existingCats = await categoriesColl.find({ name: catRegex }).toArray();
  console.log('Found matching category documents:', existingCats.map(c => c.name));

  // Delete all variants
  const deleteResult = await categoriesColl.deleteMany({ name: catRegex });
  console.log('Deleted category entries count:', deleteResult.deletedCount);

  // Insert normalized single category "Fournitures scolaire"
  await categoriesColl.insertOne({
    name: 'Fournitures scolaire',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log('✅ Created single standardized category: "Fournitures scolaire"');

  console.log('\\n--- 2. Migrating Products Collection ---');
  // A. Update category field on all products
  const productCatUpdate = await productsColl.updateMany(
    { category: catRegex },
    { $set: { category: 'Fournitures scolaire' } }
  );
  console.log('Updated products with category -> "Fournitures scolaire":', productCatUpdate.modifiedCount);

  // B. Update subcategory field on all products
  const productSubUpdate = await productsColl.updateMany(
    { subcategory: catRegex },
    { $set: { subcategory: 'Fournitures scolaire' } }
  );
  console.log('Updated products with subcategory -> "Fournitures scolaire":', productSubUpdate.modifiedCount);

  // C. Update specifications array in all products
  const productsWithSpecs = await productsColl.find({
    $or: [
      { 'specifications.value': catRegex },
      { 'specifications.key': catRegex }
    ]
  }).toArray();

  console.log('Found products with matching specifications:', productsWithSpecs.length);

  let updatedSpecsCount = 0;
  for (const prod of productsWithSpecs) {
    let changed = false;
    const newSpecs = (prod.specifications || []).map(s => {
      let key = s.key;
      let val = s.value;
      if (typeof val === 'string' && catRegex.test(val.trim())) {
        val = 'Fournitures scolaire';
        changed = true;
      }
      if (typeof key === 'string' && catRegex.test(key.trim())) {
        key = 'Fournitures scolaire';
        changed = true;
      }
      return { ...s, key, value: val };
    });

    if (changed) {
      await productsColl.updateOne(
        { _id: prod._id },
        { $set: { specifications: newSpecs } }
      );
      updatedSpecsCount++;
    }
  }
  console.log('Updated specifications in products count:', updatedSpecsCount);

  // Summary check
  const distinctCategories = await productsColl.distinct('category');
  console.log('\\nAll distinct categories in products now:');
  console.log(distinctCategories);

  await mongoose.disconnect();
  console.log('\\n🎉 Database migration finished successfully!');
}

run().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
`;

conn.on('ready', () => {
  console.log('✅ Connected via SSH to Hostinger VPS!');

  conn.sftp((err, sftp) => {
    if (err) {
      console.error('❌ SFTP Error:', err);
      conn.end();
      return;
    }

    const remoteScriptPath = `${remotePath}/backend/scripts/vps_migrate_fournitures.js`;
    console.log(`Uploading migration script to VPS: ${remoteScriptPath}...`);

    const writeStream = sftp.createWriteStream(remoteScriptPath);
    writeStream.write(remoteMigrationCode);
    writeStream.end();

    writeStream.on('close', () => {
      console.log('✅ Script uploaded. Executing migration on VPS MongoDB...');

      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node scripts/vps_migrate_fournitures.js
      `;

      conn.exec(cmd, (err, stream) => {
        if (err) {
          console.error('❌ Remote execution error:', err);
          conn.end();
          return;
        }

        let output = '';
        stream.on('close', (code) => {
          console.log(`\nExit code: ${code}`);
          console.log('VPS Migration Output:\n' + output);
          conn.end();
        }).on('data', (data) => {
          output += data;
        }).stderr.on('data', (data) => {
          output += 'STDERR: ' + data;
        });
      });
    });
  });
}).on('error', (err) => {
  console.error('❌ Connection Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
