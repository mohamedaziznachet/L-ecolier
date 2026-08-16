import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

const inspectScript = `
import mongoose from 'mongoose';
import { ProductModel } from './dist/models/index.js';

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/lecolierer0';
  await mongoose.connect(uri);

  const allProducts = await ProductModel.find({}).select('name category description').lean();
  console.log('Total Products in MongoDB:', allProducts.length);

  const trousses = allProducts.filter(p => {
    const txt = (p.name + ' ' + (p.description||'') + ' ' + (p.category||'')).toUpperCase();
    return txt.includes('TROUSSE') || txt.includes('TR0') || txt.includes('PLUMIER');
  });
  console.log('Trousses count:', trousses.length);
  if (trousses.length > 0) console.log('Sample trousses:', trousses.slice(0, 5));

  const takes = allProducts.filter(p => {
    const txt = (p.name + ' ' + (p.description||'') + ' ' + (p.category||'')).toUpperCase();
    return txt.includes('TAKE') || txt.includes('GO');
  });
  console.log('Take & Go count:', takes.length);
  if (takes.length > 0) console.log('Sample Take & Go:', takes.slice(0, 5));

  const computerBags = allProducts.filter(p => {
    const txt = (p.name + ' ' + (p.description||'') + ' ' + (p.category||'')).toUpperCase();
    return txt.includes('INFORMATIQUE') || txt.includes('LAPTOP') || txt.includes('PC') || txt.includes('ORDINATEUR');
  });
  console.log('Computer Bags count:', computerBags.length);
  if (computerBags.length > 0) console.log('Sample Computer Bags:', computerBags.slice(0, 5));

  await mongoose.disconnect();
}
run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream(`${remotePath}/backend/inspect_cats2.js`);
    writeStream.on('close', () => {
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node inspect_cats2.js
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
          console.log('Full Inspection Result:\n' + output);
          conn.end();
        }).on('data', (d) => { output += d; }).stderr.on('data', (d) => { output += 'STDERR: ' + d; });
      });
    });
    writeStream.write(inspectScript);
    writeStream.end();
  });
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
