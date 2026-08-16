import { Client } from 'ssh2';

const remotePath = '/var/www/L-ecolier';
const conn = new Client();

const inspectScript = `
import mongoose from 'mongoose';
import { ProductModel, CategoryModel, PageSettingsModel } from './dist/models/index.js';

async function run() {
  const uri = 'mongodb://127.0.0.1:27017/lecolierer0';
  await mongoose.connect(uri);

  const takeProds = await ProductModel.find({ name: { $regex: /take|go|informatique|laptop|trousse/i } }).select('name category description').lean();
  console.log('Matching Search Products Count:', takeProds.length);
  console.log('Sample Products:', takeProds.slice(0, 15));

  // Let's also check if there are products with categories containing Take, Informatique, Trousse
  const catProds = await ProductModel.find({ category: { $regex: /take|informatique|trousse/i } }).select('name category').lean();
  console.log('Category Match Count:', catProds.length);

  await mongoose.disconnect();
}
run().catch(console.error);
`;

conn.on('ready', () => {
  conn.sftp((err, sftp) => {
    if (err) throw err;
    const writeStream = sftp.createWriteStream(`${remotePath}/backend/inspect_cats.js`);
    writeStream.on('close', () => {
      const cmd = `
        export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
        cd ${remotePath}/backend
        node inspect_cats.js
      `;
      conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        let output = '';
        stream.on('close', () => {
          console.log('Inspection Result:\n' + output);
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
