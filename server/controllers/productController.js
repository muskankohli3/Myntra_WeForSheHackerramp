const Product = require("../models/Product");
const Customer = require("../models/Customer");

const SELLER_CARD_FIELDS = "brandName name avatarUrl city zone cityTier growthScore ratingAverage ratingCount";

// Turns a sizes[] + total stock into an even per-size split when the seller
// doesn't explicitly set per-size counts — keeps the Live Inventory panel and
// "Only N left" badge meaningful even for older/simple product entries.
function buildSizeStock(sizes, stock, providedSizeStock) {
  if (providedSizeStock && providedSizeStock.length) return providedSizeStock;
  const list = sizes && sizes.length ? sizes : ["S", "M", "L", "XL"];
  const per = Math.max(0, Math.floor((stock ?? 50) / list.length));
  const remainder = (stock ?? 50) - per * list.length;
  return list.map((size, i) => ({ size, quantity: per + (i === 0 ? remainder : 0) }));
}

function totalFromSizeStock(sizeStock) {
  return sizeStock.reduce((sum, s) => sum + (s.quantity || 0), 0);
}

// GET /api/products  (?category=&search=&sellerId=)
const getProducts = async (req, res) => {
  try {
    const { category, search, sellerId } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (sellerId) filter.sellerId = sellerId;
    if (search) filter.name = { $regex: search, $options: "i" };

    const products = await Product.find(filter).populate("sellerId", SELLER_CARD_FIELDS).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("sellerId", SELLER_CARD_FIELDS);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/seller/:sellerId
const getProductsBySeller = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/products/mine  (seller's own products, from token)
const getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.seller._id }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/products  (seller only)
const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      description,
      price,
      mrp,
      images,
      sizes,
      stock,
      sizeStock,
      category,
      localName,
      localDescription,
      globalName,
      globalDescription,
      festivalTags,
    } = req.body;
    if (!name || !brand || !price || !category) {
      return res.status(400).json({ message: "name, brand, price and category are required" });
    }

    const resolvedSizes = sizes && sizes.length ? sizes : undefined;
    const resolvedSizeStock = buildSizeStock(resolvedSizes, stock, sizeStock);

    const product = await Product.create({
      name,
      brand,
      description,
      price,
      mrp,
      // Data-URL (base64) images from the in-app upload, or a plain URL —
      // both are just strings to this schema. See client/src/utils/imageCompress.js
      // for how the seller-uploaded photo gets resized before it ever reaches here.
      images: images && images.length ? images : [`https://picsum.photos/seed/${encodeURIComponent(name)}/400/500`],
      sizes: resolvedSizes,
      stock: totalFromSizeStock(resolvedSizeStock),
      sizeStock: resolvedSizeStock,
      category,
      sellerId: req.seller._id,
      localName: localName || "",
      localDescription: localDescription || "",
      globalName: globalName || "",
      globalDescription: globalDescription || "",
      festivalTags: festivalTags || [],
      impressions: Math.floor(Math.random() * 400) + 50,
      clicks: Math.floor(Math.random() * 40),
      conversions: Math.floor(Math.random() * 5),
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/products/:id  (seller only, must own it)
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.sellerId) !== String(req.seller._id)) {
      return res.status(403).json({ message: "You do not own this product" });
    }

    Object.assign(product, req.body);
    if (req.body.sizeStock) {
      product.stock = totalFromSizeStock(product.sizeStock);
    }
    await product.save();
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/products/:id  (seller only, must own it)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (String(product.sellerId) !== String(req.seller._id)) {
      return res.status(403).json({ message: "You do not own this product" });
    }
    await product.deleteOne();
    res.json({ message: "Product deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/products/:id/impression  (customer viewed it — bumps a lightweight
// signal, and — when we know who's looking, thanks to protectOptional — also
// logs it into that customer's browsing history for the nearby/for-you engine.)
const registerImpression = async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { $inc: { impressions: 1 } }, { new: true });
    if (product && req.customer) {
      await Customer.findByIdAndUpdate(req.customer._id, {
        $push: {
          browsingHistory: {
            $each: [{ productId: product._id, category: product.category, viewedAt: new Date() }],
            $position: 0,
            $slice: 40,
          },
        },
      });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  getProductsBySeller,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  registerImpression,
};
