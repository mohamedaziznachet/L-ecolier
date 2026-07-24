import { connectDB } from './src/config/db.ts';
import { ProductModel } from './src/models/index.ts';

function makeFlexibleRegex(text: string): RegExp {
  let sanitized = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  sanitized = sanitized.replace(/cartable|catrable/gi, '(?:cartable|catrable)');
  const accentFlex = sanitized
    .replace(/[aàáâä]/gi, '[aàáâä]')
    .replace(/[eèéêë]/gi, '[eèéêë]')
    .replace(/[iìíîï]/gi, '[iìíîï]')
    .replace(/[oòóôö]/gi, '[oòóôö]')
    .replace(/[uùúûü]/gi, '[uùúûü]')
    .replace(/[cç]/gi, '[cç]')
    .replace(/\s+/g, '[-_\\s]+');
  return new RegExp(accentFlex, 'i');
}

async function runTest() {
  await connectDB();
  
  const category = "Cartable Lux";
  const catRegex = makeFlexibleRegex(category);

  console.log("Regex source:", catRegex.source);

  const filter = {
    status: { $ne: 'inactive' },
    $or: [
      { category: catRegex },
      { name: catRegex },
      { description: catRegex }
    ]
  };

  const results = await ProductModel.find(filter).lean();
  console.log(`\nMatched products count: ${results.length}`);
  results.forEach(r => console.log(` - ID: ${r.id}, Name: ${r.name}, Category: ${r.category}, Status: ${r.status}`));
  process.exit(0);
}

runTest();
