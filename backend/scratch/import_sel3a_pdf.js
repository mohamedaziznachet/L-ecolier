import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import { ProductModel } from './dist/models/index.js';

const productsFromPdf = [
  // Page 1
  { barcode: "3154149535118", name: "AGRAFEUSE HALF STRIP A17 MAPED", stock: 5, category: "Fournitures scolaires" },
  { barcode: "3154143534100", name: "AGRAFEUSE HALF STRIP MAPED", stock: 5, category: "Fournitures scolaires" },
  { barcode: "3154143522114", name: "AGRAFEUSE MAPED ERGO FR 35221100", stock: 10, category: "Fournitures scolaires" },
  { barcode: "3154143927100", name: "AGRAFEUSE MAPED METAL 392710", stock: 10, category: "Fournitures scolaires" },
  { barcode: "3154145404005", name: "AGRAFEUSE MAPED VIVO 540400", stock: 15, category: "Fournitures scolaires" },
  { barcode: "3154143526112", name: "AGRAFEUSSE MINI METAL DE 10 MAPED", stock: 36, category: "Fournitures scolaires" },
  { barcode: "3154142585004", name: "ARDOISE BLANCHE+ACC MAPED REF-258500", stock: 124, category: "Fournitures scolaires" },
  { barcode: "3154148502111", name: "BLS 3 MIN CRAYON NOIR MAPED", stock: 24, category: "Stylos & Crayons" },
  { barcode: "3154148454205", name: "BOITE DE 12 FEUTRES COLOR PEPES JUNGLE MAPED 845542", stock: 20, category: "Stylos & Crayons" },
  { barcode: "3154141194184", name: "BOITE GEO 8 PCS METAL MAPED", stock: 8, category: "Fournitures scolaires" },
  { barcode: "3154144642170", name: "CISEAU 13 CM MINI CUTE KIDS MAPED 464217", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154144642125", name: "CISEAU 13CM ESSENTIALS MAPED REF-464212", stock: 420, category: "Fournitures scolaires" },
  { barcode: "3154144649148", name: "CISEAU COMICS KIDS 13CM MAPED", stock: 24, category: "Fournitures scolaires" },
  { barcode: "6920000194810", name: "CISEAU KIDS PUL 12 CM VERT+BLEU MAPED *", stock: 12, category: "Fournitures scolaires" },
  { barcode: "3154144683104", name: "CISEAU MAPED GM", stock: 6, category: "Fournitures scolaires" },
  { barcode: "3154144649124", name: "CISEAU TATTOO KIDS 13CM MAPED *", stock: 12, category: "Fournitures scolaires" },
  { barcode: "3154144643122", name: "CISEAUX 13CM GAUCHER PLUSE MAPED", stock: 48, category: "Fournitures scolaires" },
  { barcode: "3154144720120", name: "CISEAUX 472012 3D MAPED *", stock: 12, category: "Fournitures scolaires" },
  { barcode: "3411037474790", name: "COLLE STICK 40G MAPED REF-747479", stock: 20, category: "Fournitures scolaires" },
  { barcode: "3411037472796", name: "COLLE STICK MAPED 21G", stock: 2, category: "Fournitures scolaires" },
  { barcode: "3411037471799", name: "COLLE STICK MAPED 8.2G", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154141916113", name: "COMPA A BAGUE PLASTIQUE MAPED *", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154141975127", name: "COMPAS AVEC MINE 3PCS MAPED", stock: 12, category: "Fournitures scolaires" },
  { barcode: "3154141926112", name: "COMPAS BAGUE STOPSAFE 2 PIECES MAPED REF-192611", stock: 5, category: "Fournitures scolaires" },
  { barcode: "3154141194108", name: "COMPAS MAPED CRAYON 119410", stock: 480, category: "Fournitures scolaires" },
  { barcode: "3154141961014", name: "COMPAS MAPED STOP SYSTEM 5P", stock: 8, category: "Fournitures scolaires" },
  { barcode: "3154145369533", name: "COMPAS METAL OPEN METAL MAPED *", stock: 8, category: "Fournitures scolaires" },
  { barcode: "3154141915116", name: "COMPAS PLASTIQUE MINE KIDS 191511 MAPED", stock: 48, category: "Fournitures scolaires" },
  { barcode: "3154141194306", name: "COMPAS PORTE MINE 0.5119430 MAPED", stock: 32, category: "Fournitures scolaires" },
  { barcode: "3154141961007", name: "COMPAS STOP SYS 3P MAPED 196100", stock: 12, category: "Fournitures scolaires" },
  { barcode: "3154141194054", name: "COMPAS STUDY 5 PIECES MAPED REF-119405", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154141941023", name: "COMPAS STUDY POP BAGUE MAPED REF194102", stock: 90, category: "Fournitures scolaires" },
  { barcode: "3154141951107", name: "COMPAS STUDY STOP MINE MAPED *", stock: 20, category: "Fournitures scolaires" },
  { barcode: "3154145181104", name: "COMPAS VIVO 518110 MAPED", stock: 60, category: "Fournitures scolaires" },

  // Page 2
  { barcode: "3154141832246", name: "CRAYON DE COULEUR MAPED 24/18", stock: 24, category: "Stylos & Crayons" },
  { barcode: "3154148518136", name: "CRAYON NOIR AVEC GOMME NIGHTFALL HB2 MAPED REF-851813", stock: 100, category: "Stylos & Crayons" },
  { barcode: "3154148517603", name: "CRAYON NOIR HB2 + GOMME DECORE MAPED REF-851760", stock: 12, category: "Stylos & Crayons" },
  { barcode: "3154148540212", name: "CRAYON NOIR HB-2 MAPED *", stock: 24, category: "Stylos & Crayons" },
  { barcode: "3154148500230", name: "CRAYON NOIR MAPED N4", stock: 48, category: "Stylos & Crayons" },
  { barcode: "3154148518129", name: "CRAYON NOIR PLASTIQUE MAPED *", stock: 24, category: "Stylos & Crayons" },
  { barcode: "3154148610113", name: "CRAYON PASTEL DE 12 WAX MAPED 861011", stock: 120, category: "Matériel artistique" },
  { barcode: "3154148325017", name: "CRAYONS DE COULEUR DE 6 MAPED MINI", stock: 48, category: "Stylos & Crayons" },
  { barcode: "3154148500216", name: "CRAYONS GRAPHITES HB=2 MAPED -", stock: 40, category: "Stylos & Crayons" },
  { barcode: "3154140182113", name: "CUTTER MAPED GM", stock: 10, category: "Fournitures scolaires" },
  { barcode: "3154142424211", name: "EQUERRE 45*21CM GEOMETRIQUE MAPED REF-242421", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154142426215", name: "EQUERRE 60-21 CM MAPED", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154142794109", name: "EQUERRE MAPED FLEX 60/15 279410", stock: 50, category: "Fournitures scolaires" },
  { barcode: "3154142444219", name: "EQUERRE MAPED INCASSABLE 45 21CM", stock: 20, category: "Fournitures scolaires" },
  { barcode: "3154142551108", name: "EQUERRE MAPED INCASSABLE 60/45M", stock: 10, category: "Fournitures scolaires" },
  { barcode: "3154145604306", name: "ETUIS DE 12 MINES 0.7 HB MAPED REF-560430", stock: 110, category: "Stylos & Crayons" },
  { barcode: "3154148454694", name: "FEUTRE DE 10 COLOR PEPES PASTEL MAPED 845469", stock: 4, category: "Stylos & Crayons" },
  { barcode: "3154148457237", name: "FEUTRE OCEAN 6 MAPED 845723", stock: 120, category: "Stylos & Crayons" },
  { barcode: "3154148115205", name: "GAUACHE MAPED SUPER PIGMENTED", stock: 12, category: "Matériel artistique" },
  { barcode: "G010", name: "GOMME DUO MEDIUM 40 MAPED *", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154141195112", name: "GOMME MAPED", stock: 48, category: "Fournitures scolaires" },
  { barcode: "3154145110104", name: "GOMME MAPED ARCHTECTE", stock: 48, category: "Fournitures scolaires" },
  { barcode: "3154145120004", name: "GOMME MAPED STICK", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154140113001", name: "GOMME MINI TECHNIC 300 MAPED 011300", stock: 350, category: "Fournitures scolaires" },
  { barcode: "3154141161155", name: "GOMME NIGHTFALL MAPED 116115", stock: 80, category: "Fournitures scolaires" },
  { barcode: "3154141130502", name: "GOMME PLAS TECHNIC PLUSE PM MAPED", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154145113204", name: "GOMME PROTECTION ZENOA MAPED", stock: 12, category: "Fournitures scolaires" },
  { barcode: "3154140116002", name: "GOMME TECHNIC 011600 MAPED *", stock: 400, category: "Fournitures scolaires" },
  { barcode: "3154141205118", name: "GOMME TECHNIC PROTECTION -MAPED", stock: 48, category: "Fournitures scolaires" },
  { barcode: "3154145117905", name: "GOMME TECHNIC SOFTY REF 511790 MAPED *", stock: 100, category: "Fournitures scolaires" },
  { barcode: "3154141067112", name: "GOMME TECHNIC ULTRA MAPED *", stock: 24, category: "Fournitures scolaires" },
  { barcode: "3154148105107", name: "GOUACHE DE 12 TUBE 12ML MAPED REF-8105107", stock: 60, category: "Matériel artistique" },
  { barcode: "3154148105206", name: "GOUACHE DE 12 TUBES 12ML BTE PLAS MAPED -", stock: 24, category: "Matériel artistique" },
  { barcode: "3154148105404", name: "GOUACHE DE 5 TUBE BLS MAPED REF-810540", stock: 24, category: "Matériel artistique" },
  { barcode: "3154149817221", name: "KIT GEOMETRIQUE MAPED 4PIECE", stock: 48, category: "Fournitures scolaires" },

  // Page 3
  { barcode: "3154146565101", name: "Perforateurs 65/70 F Maped", stock: 6, category: "Fournitures scolaires" },
  { barcode: "3154148457244", name: "POCH FEUTRE 10 OCEAN MAPED 845724", stock: 96, category: "Stylos & Crayons" },
  { barcode: "3154148454007", name: "POCH FEUTRE 12 MONSTER MAPED 845400", stock: 24, category: "Stylos & Crayons" },
  { barcode: "3154148454014", name: "POCH FEUTRE 24 MONSTER MAPED 845401", stock: 8, category: "Stylos & Crayons" },
  { barcode: "3154148457206", name: "POCH FEUTRE OCEAN DE 12 MAPED 845720", stock: 200, category: "Stylos & Crayons" },
  { barcode: "3154148950240", name: "POCH GEO PM TWIST 15 CM 895024 MAPED *", stock: 50, category: "Fournitures scolaires" },
  { barcode: "3154142440693", name: "POCH GEO 15CM INCASSABLE MAPED REF-244069", stock: 150, category: "Fournitures scolaires" },
  { barcode: "3154148971580", name: "POCH GEO 20CM TWIST 4 PIECES MAPED REF-897158", stock: 20, category: "Fournitures scolaires" },
  { barcode: "3154142428158", name: "POCH GEO MAPED PM 242815", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154142428301", name: "POCHE GEO MAPED GM", stock: 48, category: "Fournitures scolaires" },
  { barcode: "3154142443045", name: "POCHETTE GEOMETRIQUE 30CM INCASSABLE 4 PIECES MAPED 244304", stock: 20, category: "Fournitures scolaires" },
  { barcode: "3154148454427", name: "POCHETTE DE 12 FEUTRE JUNGLE COSMIC MAPED *", stock: 40, category: "Stylos & Crayons" },
  { barcode: "3154142244048", name: "POCHETTE DE 4 STYLO MAPED", stock: 12, category: "Stylos & Crayons" },
  { barcode: "3154142428202", name: "POCHETTE GEOMETRIQUE 4 PCS 20CM MAPED", stock: 120, category: "Fournitures scolaires" },
  { barcode: "3154148950554", name: "POCHETTE TRACAGE TWIST 30CM MAPED *", stock: 30, category: "Fournitures scolaires" },
  { barcode: "3154145599114", name: "PORTE MINE +MINE 0.7 MAPED", stock: 6, category: "Stylos & Crayons" },
  { barcode: "3154145599305", name: "PORTE MINE 0.7 AUTOMATIC BLEU MAPED", stock: 6, category: "Stylos & Crayons" },
  { barcode: "3154145640304", name: "PORTE MINE BLEU 0.5 MAPED *", stock: 12, category: "Stylos & Crayons" },
  { barcode: "3154145640366", name: "PORTE MINE LONG 0.5 ROSE MAPED REF-564036", stock: 6, category: "Stylos & Crayons" },
  { barcode: "3154145595369", name: "PORTE MINE ROSE AUTOMATIC 0.5 MAPED *", stock: 6, category: "Stylos & Crayons" },
  { barcode: "3154142441805", name: "RAPPORTEUR MAPED GM INCASSABLE", stock: 10, category: "Fournitures scolaires" },
  { barcode: "3154142440600", name: "REGLE 15 CM INCASSABLE MAPED REF-244060", stock: 100, category: "Fournitures scolaires" },
  { barcode: "3154142791153", name: "REGLE 15 CM MAPED *", stock: 100, category: "Fournitures scolaires" },
  { barcode: "3154141461125", name: "REGLE 20CM CLASSIC MAPED 146112", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154142789105", name: "REGLE 20CM TWIST PLAUSE -MAPED", stock: 10, category: "Fournitures scolaires" },
  { barcode: "3154142797100", name: "REGLE 30CM MAPED TWIST", stock: 100, category: "Fournitures scolaires" },
  { barcode: "3154142440204", name: "REGLE INCASSABLE EN BLISTER 20 CM MAPED 440204", stock: 40, category: "Fournitures scolaires" },
  { barcode: "3154141465079", name: "REGLE MAPED 15 CM", stock: 110, category: "Fournitures scolaires" },
  { barcode: "3154142791108", name: "REGLE MAPED 15 CM TWIST 279110", stock: 20, category: "Fournitures scolaires" },
  { barcode: "3154141465109", name: "REGLE MAPED 20 CM", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154141461149", name: "REGLE MAPED 40 CM", stock: 5, category: "Fournitures scolaires" },
  { barcode: "3154142420206", name: "REGLE PLATE 20 CM GRAPHIC MAPED", stock: 100, category: "Fournitures scolaires" },
  { barcode: "3154142454102", name: "REGLE PLATE 20CM STUDY MAPED *", stock: 50, category: "Fournitures scolaires" },
  { barcode: "3154142792105", name: "REGLE PLATE 20CM TWIST FLEX MAPED REF- 279210", stock: 60, category: "Fournitures scolaires" },
  { barcode: "3154142420305", name: "REGLE PLATE 30CM GRAPHIC MAPED *", stock: 30, category: "Fournitures scolaires" },

  // Page 4
  { barcode: "3154140631116", name: "TAILLE CRAYON MAPED VIVO 1TR+ RES", stock: 120, category: "Stylos & Crayons" },
  { barcode: "3154145063004", name: "TAILLE CRAYON PLAST VIVO 1TR MAPED REF-506300", stock: 200, category: "Stylos & Crayons" },
  { barcode: "3154140714505", name: "TAILLE CRAYON RESERVE PLUSE 1 TROU MAPED", stock: 100, category: "Stylos & Crayons" },
  { barcode: "3154140714109", name: "TAILLE CRAYON STICK 2T MAPED", stock: 12, category: "Stylos & Crayons" },
  { barcode: "3154140625115", name: "TAILLE CRAYON VIVO 2 TR MAPED *", stock: 24, category: "Stylos & Crayons" },
  { barcode: "3154140630119", name: "TAILLE CRAYON VIVO PASTEL 1 T MAPED *", stock: 200, category: "Stylos & Crayons" },
  { barcode: "3154142776204", name: "TRACE CERCLE MAPED 277620", stock: 6, category: "Fournitures scolaires" },
  { barcode: "3154142586087", name: "TRACE LETTRE MAPED 8MM 258608", stock: 6, category: "Fournitures scolaires" },
  { barcode: "3154142786104", name: "TRIPLE DECIMETRE KIDY'GRIP FOURREAU MAPED", stock: 5, category: "Fournitures scolaires" }
];

async function run() {
  const uri = process.env.MONGODB_URI?.includes('mongo:') ? 'mongodb://127.0.0.1:27017/lecolierer0' : (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lecolierer0');
  await mongoose.connect(uri);
  console.log(`Connected to MongoDB at ${uri}!`);

  const maxItem = await ProductModel.findOne().sort({ id: -1 }).lean();
  let nextId = maxItem && maxItem.id ? Number(maxItem.id) + 1 : 1000;

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of productsFromPdf) {
    const existing = await ProductModel.findOne({
      $or: [
        { name: item.name },
        { barcode: item.barcode }
      ]
    });

    if (existing) {
      existing.stock = item.stock;
      existing.status = 'active';
      existing.brand = 'Maped';
      existing.category = item.category;
      await existing.save();
      updatedCount++;
    } else {
      await ProductModel.create({
        id: nextId++,
        name: item.name,
        description: `Produit Maped - ${item.name}`,
        price: '0,000 DT',
        priceNum: 0,
        category: item.category,
        brand: 'Maped',
        stock: item.stock,
        status: 'active',
        availability: 'En stock',
        img: '',
        images: [],
        barcode: item.barcode
      });
      createdCount++;
    }
  }

  console.log(`✅ Import finished! Created: ${createdCount}, Updated: ${updatedCount}, Total in PDF: ${productsFromPdf.length}`);
  await mongoose.disconnect();
}

run().catch(console.error);
