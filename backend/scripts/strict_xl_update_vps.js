import { Client } from 'ssh2';

const conn = new Client();

const remoteCode = `
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0';

async function run() {
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const productsColl = db.collection('products');

  console.log('=== 1. Identifying Products ===');
  const allSB = await productsColl.find({
    $or: [
      { name: /sb0[12]/i },
      { 'specifications.value': /sb0[12]/i }
    ]
  }).toArray();

  const isXL = (name, specs) => {
    if (/sb0[12][-_\\s]*xl/i.test(name)) return true;
    for (const s of (specs || [])) {
      if (/sb0[12][-_\\s]*xl/i.test(s.value || '')) return true;
    }
    return false;
  };

  const isSB01XL = (p) => /sb01[-_\\s]*xl/i.test(p.name) || (p.specifications || []).some(s => /sb01[-_\\s]*xl/i.test(s.value || ''));
  const isSB02XL = (p) => /sb02[-_\\s]*xl/i.test(p.name) || (p.specifications || []).some(s => /sb02[-_\\s]*xl/i.test(s.value || ''));
  
  const sb01XLList = allSB.filter(isSB01XL);
  const sb02XLList = allSB.filter(isSB02XL);
  const nonXLList = allSB.filter(p => !isSB01XL(p) && !isSB02XL(p));

  console.log('SB01-XL count:', sb01XLList.length);
  console.log(sb01XLList.map(p => p.name));

  console.log('\\nSB02-XL count:', sb02XLList.length);
  console.log(sb02XLList.map(p => p.name));

  console.log('\\nNon-XL SB count:', nonXLList.length);
  console.log(nonXLList.map(p => p.name));

  // Update SB01-XL ONLY
  for (const prod of sb01XLList) {
    let specs = (prod.specifications || []).filter(s => {
      const k = (s.key || '').trim().toLowerCase();
      return k !== 'étatique' && k !== 'etatique' && k !== 'privé' && k !== 'prive' && k !== 'école étatique' && k !== 'école privée';
    });

    specs.unshift(
      { key: 'Étatique', value: '1ère ➔ 3ème' },
      { key: 'Privé', value: 'Aucun (Non adapté)' }
    );

    await productsColl.updateOne(
      { _id: prod._id },
      {
        $set: {
          description: 'Étatique : 1ère ➔ 3ème (Privé : Aucun)',
          schoolLevel: '1ère ➔ 3ème (Étatique)',
          specifications: specs
        }
      }
    );
  }

  // Update SB02-XL ONLY
  for (const prod of sb02XLList) {
    let specs = (prod.specifications || []).filter(s => {
      const k = (s.key || '').trim().toLowerCase();
      return k !== 'étatique' && k !== 'etatique' && k !== 'privé' && k !== 'prive' && k !== 'école étatique' && k !== 'école privée';
    });

    specs.unshift(
      { key: 'Étatique', value: '3ème ➔ 6ème' },
      { key: 'Privé', value: 'Aucun (Non adapté)' }
    );

    await productsColl.updateOne(
      { _id: prod._id },
      {
        $set: {
          description: 'Étatique : 3ème ➔ 6ème (Privé : Aucun)',
          schoolLevel: '3ème ➔ 6ème (Étatique)',
          specifications: specs
        }
      }
    );
  }

  // Reset non-XL SB products (remove XL Étatique/Privé specs, restore standard Étatique : 1ère ➔ 4ème or original)
  for (const prod of nonXLList) {
    let specs = (prod.specifications || []).filter(s => {
      const k = (s.key || '').trim().toLowerCase();
      return k !== 'étatique' && k !== 'etatique' && k !== 'privé' && k !== 'prive' && k !== 'école étatique' && k !== 'école privée';
    });

    specs.unshift(
      { key: 'Étatique', value: '1ère ➔ 4ème' }
    );

    await productsColl.updateOne(
      { _id: prod._id },
      {
        $set: {
          description: 'Étatique : 1ère ➔ 4ème',
          schoolLevel: '1ère ➔ 4ème',
          specifications: specs
        }
      }
    );
  }

  console.log('\\n🎉 Strict SB01-XL vs SB02-XL vs non-XL separation completed successfully!');

  await mongoose.disconnect();
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
    const ws = sftp.createWriteStream('/var/www/L-ecolier/backend/scripts/strict_xl_update.js');
    ws.write(remoteCode);
    ws.end();
    ws.on('close', () => {
      conn.exec('export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"; cd /var/www/L-ecolier/backend; node scripts/strict_xl_update.js', (err2, stream) => {
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
