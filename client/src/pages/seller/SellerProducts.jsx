import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Package } from "lucide-react";
import { productService } from "../../services/productService";
import { Spinner, EmptyState } from "../../components/ui/Primitives";
import Button from "../../components/ui/Button";
import ProductForm from "../../components/seller/ProductForm";

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  function load() {
    setLoading(true);
    productService
      .getMine()
      .then(setProducts)
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleSubmit(payload) {
    if (editingProduct) {
      const updated = await productService.update(editingProduct._id, payload);
      setProducts((prev) => prev.map((p) => (p._id === updated._id ? updated : p)));
    } else {
      const created = await productService.create(payload);
      setProducts((prev) => [created, ...prev]);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this product? This can't be undone.")) return;
    await productService.remove(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
  }

  function openEdit(product) {
    setEditingProduct(product);
    setFormOpen(true);
  }

  function openAdd() {
    setEditingProduct(null);
    setFormOpen(true);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">My Products</h1>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-8 w-8" />
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products yet"
          subtitle="Add your first product to start selling — live or in the catalog."
          action={
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {products.map((p) => (
            <div key={p._id} className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
              <img src={p.images?.[0]} alt={p.name} className="aspect-[4/5] w-full object-cover" />
              <div className="p-2.5">
                <p className="truncate text-sm font-semibold text-gray-800">{p.name}</p>
                <p className="text-xs text-gray-400">{p.category}</p>
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-900">₹{p.price}</p>
                  <p className="text-[10px] text-gray-400">{p.ctr ?? 0}% CTR</p>
                </div>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => openEdit(p)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-full border border-gray-200 py-1.5 text-xs font-semibold text-gray-600 hover:border-brand-300"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="flex items-center justify-center rounded-full border border-gray-200 px-2.5 py-1.5 text-red-400 hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ProductForm isOpen={formOpen} onClose={() => setFormOpen(false)} onSubmit={handleSubmit} initialProduct={editingProduct} />
    </div>
  );
}
