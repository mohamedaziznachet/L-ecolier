import { connectDB } from './src/config/db.ts';
import { ProductModel } from './src/models/index.ts';

function makeFlexibleRegex(text: string): RegExp {
  let sanitized = text.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  sanitized = sanitized.replace(/c[ar]*t[ar]*ble/gi, 'c[ar]*t[ar]*ble');
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
  const conditions: any[] = [
    { status: { $ne: 'inactive' } }
  ];

  if (category) {
    const parts = category.split('&').map(p => p.trim()).filter(Boolean);
    const catOrConditions: any[] = [];
    for (const part of parts) {
      const catRegex = makeFlexibleRegex(part);
      catOrConditions.push(
        { category: catRegex },
        { brand: catRegex },
        { name: catRegex },
        { description: catRegex },
        { schoolLevel: catRegex }
      );
    }
    conditions.push({ $or: catOrConditions });
  }

  const filter = conditions.length === 1 ? conditions[0] : { $and: conditions };

  console.log("Filter Object:", JSON.stringify(filter, null, 2));

  const results = await ProductModel.find(filter).lean();
  console.log(`\nMatched products count: ${results.length}`);
  results.forEach(r => console.log(` - ID: ${r.id}, Name: ${r.name}, Category: ${r.category}, Status: ${r.status}`));
  process.exit(0);
}

runTest();
