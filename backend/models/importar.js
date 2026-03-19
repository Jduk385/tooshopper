const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const productSchema = new mongoose.Schema({
  name: String,
  sku: String,
  variant: String,
  price: Number,
  images: [String],
  image: String,
  available_stock: { type: Number, default: 10 },
  isActive: { type: Boolean, default: true }
}, { collection: 'products' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

async function importar() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
    await mongoose.connect(uri);
    console.log("✅ Conectado a MongoDB Atlas");

    // Buscamos el archivo en la misma carpeta models
    const jsonPath = path.join(__dirname, 'products.json');
    
    if (!fs.existsSync(jsonPath)) {
      throw new Error("❌ No encontré el archivo 'products.json' en la carpeta backend/models");
    }

    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(rawData);
    const items = Array.isArray(data) ? data : (data.items || []);

    //console.log("🧹 Limpiando base de datos...");
    //await Product.deleteMany({});

    // Quitamos el _id de texto para que MongoDB no de error
    const itemsLimpios = items.map(item => {
      const { _id, ...resto } = item; 
      return {
        ...resto,
        isActive: true,
        price: Number(item.price || 0)
      };
    });

    //await Product.insertMany(itemsLimpios);
    console.log(`🚀 ¡ÉXITO TOTAL! Se subieron las ${itemsLimpios.length} referencias.`);
    process.exit();
  } catch (err) {
    console.error("❌ ERROR:", err.message);
    process.exit(1);
  }
}

importar();