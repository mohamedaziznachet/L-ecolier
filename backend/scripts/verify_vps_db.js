import { Client } from 'ssh2';

const conn = new Client();

conn.on('ready', () => {
  console.log('Connecting to VPS to check MongoDB products count...');
  const cmd = `
    export PATH="/root/.nvm/versions/node/v22.23.2/bin:$PATH"
    export MONGODB_URI="mongodb://127.0.0.1:27017/lecolierer0"
    node -e "
      import mongoose from 'mongoose';
      async function check() {
        await mongoose.connect(process.env.MONGODB_URI);
        const count = await mongoose.connection.db.collection('products').countDocuments();
        const inStock = await mongoose.connection.db.collection('products').countDocuments({ availability: 'En stock' });
        const sampleNew = await mongoose.connection.db.collection('products').findOne({ name: 'SB02-NINJA' });
        console.log('VPS Total Products:', count);
        console.log('VPS In Stock Products:', inStock);
        console.log('VPS Sample SB02-NINJA:', JSON.stringify(sampleNew, null, 2));
        await mongoose.disconnect();
      }
      check();
    "
  `;
  conn.exec(cmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('VPS Check Output:\n' + output);
      conn.end();
    }).on('data', (data) => {
      output += data;
    });
  });
}).on('error', (err) => {
  console.error('Error:', err);
}).connect({
  host: '69.62.115.32',
  port: 22,
  username: 'root',
  password: 'Librairieecolier@11'
});
