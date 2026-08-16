import { Client } from 'ssh2';

const conn = new Client();

const remoteCode = `
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  console.log('--- 1. Updating SB01 / SB01-XL Products ---');
  // Match sb01 or sb01-xl
  const sb01Query = {
    $or: [
      { name: /sb01/i },
      { 'specifications.value': /sb01/i }
    ]
  };

  const sb01Products = await productsColl.find(sb01Query).toArray();
  console.log('Found SB01 products count:', sb01Products.length);

  for (const prod of sb01Products) {
    // Clean up specifications: update or add Étatique and Privé
    let specs = (prod.specifications || []).filter(s => {
      const k = (s.key || '').trim().toLowerCase();
      return k !== 'étatique' && k !== 'etatique' && k !== 'privé' && k !== 'prive' && k !== 'école étatique' && k !== 'école privée';
    });

    specs.unshift(
      { key: 'Étatique', value: '1ère ➔ 3ème' },
      { key: 'Privé', value: 'Aucun (Non adapté)' }
    );

    const desc = 'Étatique : 1ère ➔ 3ème (Privé : Aucun)';

    await productsColl.updateOne(
      { _id: prod._id },
      {
        $set: {
          description: desc,
          schoolLevel: '1ère ➔ 3ème (Étatique)',
          specifications: specs
        }
      }
    );
  }
  console.log('✅ Updated all SB01 products.');

  console.log('\\n--- 2. Updating SB02 / SB02-XL Products ---');
  // Match sb02 or sb02-xl
  const sb02Query = {
    $or: [
      { name: /sb02/i },
      { 'specifications.value': /sb02/i }
    ]
  };

  const sb02Products = await productsColl.find(sb02Query).toArray();
  console.log('Found SB02 products count:', sb02Products.length);

  for (const prod of sb02Products) {
    let specs = (prod.specifications || []).filter(s => {
      const k = (s.key || '').trim().toLowerCase();
      return k !== 'étatique' && k !== 'etatique' && k !== 'privé' && k !== 'prive' && k !== 'école étatique' && k !== 'école privée';
    });

    specs.unshift(
      { key: 'Étatique', value: '3ème ➔ 6ème' },
      { key: 'Privé', value: 'Aucun (Non adapté)' }
    );

    const desc = 'Étatique : 3ème ➔ 6ème (Privé : Aucun)';

    await productsColl.updateOne(
      { _id: prod._id },
      {
        $set: {
          description: desc,
          schoolLevel: '3ème ➔ 6ème (Étatique)',
          specifications: specs
        }
      }
    );
  }
  console.log('✅ Updated all SB02 products.');

  // Verification
  console.log('\\n=== Verification Sample SB01 ===');
  const sample1 = await productsColl.findOne(sb01Query);
  console.log(sample1 ? { name: sample1.name, description: sample1.description, schoolLevel: sample1.schoolLevel, specifications: sample1.specifications } : 'None');

  console.log('\\n=== Verification Sample SB02 ===');
  const sample2 = await productsColl.findOne(sb02Query);
  console.log(sample2 ? { name: sample2.name, description: sample2.description, schoolLevel: sample2.schoolLevel, specifications: sample2.specifications } : 'None');

  await mongoose.disconnect();
  console.log('\\n🎉 All SB01 and SB02 products successfully updated!');
}

run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    const ws = sftp.createWriteStream('/var/www/L-ecolier/backend/scripts/update_sb_levels.js');
    ws.write(remoteCode);
    ws.end();
    ws.on('close', () => {
      conn.exec('export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"; cd /var/www/L-ecolier/backend; node scripts/update_sb_levels.js', (err2, stream) => {
        let out = '';
        stream.on('data', d => out += d);
        stream.stderr.on('data', d => out += 'ERR: ' + d);
        stream.on('close', () => {
          console.log(out);
          conn.end();
        });
      });
    });
  });
}).on('error', console.error).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
