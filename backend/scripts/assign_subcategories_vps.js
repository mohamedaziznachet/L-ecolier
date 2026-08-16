import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import { ProductModel, CategoryModel } from '../dist/models/index.js';

const CATEGORY_SUBCATEGORIES_MAP = {
  "Fournitures Scolaires": [
    "Crayon Noir", "Crayon de Couleur", "Stylo à Bille", "Feutre & Marqueur",
    "Gomme", "Taille-Crayon", "Mines", "Ciseaux", "Colle & Adhésif",
    "Correcteur", "Instruments de Traçage", "Agrafage", "Bureautique"
  ],
  "Fournitures scolaire": [
    "Crayon Noir", "Crayon de Couleur", "Stylo à Bille", "Feutre & Marqueur",
    "Gomme", "Taille-Crayon", "Mines", "Ciseaux", "Colle & Adhésif",
    "Correcteur", "Instruments de Traçage", "Agrafage", "Bureautique"
  ],
  "Bomi": [
    "Cartable Lux", "Cartable Eco Lux", "Cartable super lux", "Cartable high lux",
    "Trousse", "Lunch box", "paniers", "Chariots"
  ],
  "Sac A Dos": [
    "Sac A Dos Informatique", "Take And Go", "Trousse"
  ],
  "Bagagerie": [
    "Valise WAMA"
  ],
  "Parascolaires": [
    "Dictionnaires", "Atlas & Cartes", "Livres Éducatifs", "Cahiers d'Exercices"
  ],
  "Gourde & Thermos": [
    "TupperWare", "Rotpunkt", "Uzspace"
  ],
  "Cahiers & Papeterie": [
    "Cahiers", "Brochures & Blocs", "Carnets & Agendas", "Ramettes"
  ],
  "Rangement & Classement": [
    "Classeurs", "Chemises", "Porte-Documents"
  ],
  "Matériel Artistique & Dessin": [
    "Peinture & Gouache", "Crayons de Dessin", "Pinceaux & Palettes", "Papier Dessin"
  ],
  "Jeux Et Cadeaux": [
    "Jeux Éducatifs", "Jouets", "Cadeaux Scolaires"
  ]
};

function determineSubcategory(p) {
  const text = `${p.name || ''} ${p.description || ''} ${p.category || ''}`.toUpperCase();

  // 1. Fournitures Scolaires
  if (text.includes('CRAYON DE COULEUR') || text.includes('CRAYON COULEUR') || text.includes('COULEURS')) return 'Crayon de Couleur';
  if (text.includes('CRAYON NOIR') || text.includes('CRAYON GRAPH') || text.includes('GRAPHITE')) return 'Crayon Noir';
  if (text.includes('FEUTRE') || text.includes('MARQUEUR') || text.includes('SURNEUR') || text.includes('HIGHLIGHTER')) return 'Feutre & Marqueur';
  if (text.includes('GOMME')) return 'Gomme';
  if (text.includes('TAILLE CRAYON') || text.includes('TAILLE-CRAYON') || text.includes('T.CRAY')) return 'Taille-Crayon';
  if (text.includes('STYLO') || text.includes('BILLE') || text.includes('ROLLER') || text.includes('GEL')) return 'Stylo à Bille';
  if (text.includes('REGLE') || text.includes('EQUERRE') || text.includes('COMPAS') || text.includes('RAPPORTEUR') || text.includes('TRACAGE') || text.includes('GEOMETRIE')) return 'Instruments de Traçage';
  if (text.includes('CISEAU')) return 'Ciseaux';
  if (text.includes('COLLE') || text.includes('ADHESIF') || text.includes('SCOTCH') || text.includes('RUBAN')) return 'Colle & Adhésif';
  if (text.includes('CORRECTEUR') || text.includes('TIPP-EX') || text.includes('BLANCO') || text.includes('CORRECTION')) return 'Correcteur';
  if (text.includes('MINES')) return 'Mines';
  if (text.includes('AGRAF')) return 'Agrafage';
  if (text.includes('PUNAISE') || text.includes('TROMBONE') || text.includes('PERFORATEUR') || text.includes('BUREAUTIQUE')) return 'Bureautique';

  // 2. Bomi & Sacs
  if (text.includes('INFORMATIQUE') || text.includes('LAPTOP') || text.includes('SDI')) return 'Sac A Dos Informatique';
  if (text.includes('TAKE AND GO') || text.includes('TAKE & GO')) return 'Take And Go';
  if (text.includes('SB02') || text.includes('ECO LUX')) return 'Cartable Eco Lux';
  if (text.includes('SB03') || text.includes('HIGH LUX')) return 'Cartable high lux';
  if (text.includes('SBL') || text.includes('SUPER LUX')) return 'Cartable super lux';
  if (text.includes('SB01') || text.includes('CARTABLE LUX') || text.includes('SD0')) return 'Cartable Lux';
  if (text.includes('CHARIOT') || text.includes('TLUX')) return 'Chariots';
  if (text.includes('TROUSSE') || text.includes('TS0')) return 'Trousse';
  if (text.includes('LUNCH') || text.includes('BOITE')) return 'Lunch box';
  if (text.includes('PANIER') || text.includes('CL0')) return 'paniers';
  if (text.includes('VALISE') || text.includes('WAMA')) return 'Valise WAMA';

  // 3. Gourde & Thermos
  if (text.includes('TUPPERWARE')) return 'TupperWare';
  if (text.includes('ROTPUNKT')) return 'Rotpunkt';
  if (text.includes('UZSPACE')) return 'Uzspace';

  // 4. Cahiers & Rangement
  if (text.includes('CLASSEUR')) return 'Classeurs';
  if (text.includes('CHEMISE')) return 'Chemises';
  if (text.includes('PORTE DOC') || text.includes('PORTE-DOCUMENTS')) return 'Porte-Documents';
  if (text.includes('CAHIER')) return 'Cahiers';
  if (text.includes('BROCHURE') || text.includes('BLOC')) return 'Brochures & Blocs';
  if (text.includes('AGENDA') || text.includes('CARNET')) return 'Carnets & Agendas';
  if (text.includes('RAMETTE')) return 'Ramettes';

  // 5. Matériel Artistique
  if (text.includes('GOUACHE') || text.includes('PEINTURE') || text.includes('AQUARELLE')) return 'Peinture & Gouache';
  if (text.includes('PINCEAU') || text.includes('PALETTE')) return 'Pinceaux & Palettes';
  if (text.includes('CANSON') || text.includes('DESSIN')) return 'Papier Dessin';
  if (text.includes('ARTISTIQUE')) return 'Crayons de Dessin';

  // 6. Parascolaires & Jeux
  if (text.includes('DICTIONNAIRE')) return 'Dictionnaires';
  if (text.includes('ATLAS') || text.includes('CARTE')) return 'Atlas & Cartes';
  if (text.includes('JEU')) return 'Jeux Éducatifs';
  if (text.includes('JOUET')) return 'Jouets';
  if (text.includes('CADEAU')) return 'Cadeaux Scolaires';

  return '';
}

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  // 1. Seed Subcategories in CategoryModel
  for (const [catName, subList] of Object.entries(CATEGORY_SUBCATEGORIES_MAP)) {
    const subDocs = subList.map(s => ({ name: s, image: '' }));
    await CategoryModel.updateOne(
      { name: catName },
      { $set: { subcategories: subDocs } },
      { upsert: true }
    );
  }
  console.log('✅ Seeded subcategories in CategoryModel!');

  // 2. Auto-assign subcategory to all Products
  const products = await ProductModel.find({}).select('_id name description category subcategory').lean();
  console.log(`Analyzing ${products.length} products for subcategory assignment...`);

  const bulkOps = [];
  let assignedCount = 0;

  for (const p of products) {
    const sub = determineSubcategory(p);
    if (sub && p.subcategory !== sub) {
      bulkOps.push({
        updateOne: {
          filter: { _id: p._id },
          update: { $set: { subcategory: sub } }
        }
      });
      assignedCount++;
    }
  }

  if (bulkOps.length > 0) {
    await ProductModel.bulkWrite(bulkOps);
    console.log(`✅ Auto-assigned subcategory to ${assignedCount} products!`);
  } else {
    console.log('ℹ️ All products already have subcategories assigned.');
  }

  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Error running assign_subcategories_vps:', err);
  process.exit(1);
});
