import { useState, useEffect, useMemo } from "react";
import { X, Sparkles } from "lucide-react";
import Button from "../ui/Button";
import ImageUploadField from "./ImageUploadField";
import SellerProductNamingTool from "./SellerProductNamingTool";

const CATEGORIES = ["T-Shirts", "Bottoms", "Footwear", "Kurtas", "Jackets", "Hoodies", "Shirts", "Dresses", "Accessories"];

const EMPTY = {
  name: "",
  brand: "",
  category: "T-Shirts",
  price: "",
  mrp: "",
  description: "",
  stock: 50,
  sizes: "S,M,L,XL",
  image: "",
  localName: "",
  localDescription: "",
  globalName: "",
  globalDescription: "",
  namingPrimary: "original",
};

function evenSplit(sizesArr, total) {
  const per = Math.floor(total / (sizesArr.length || 1));
  const rem = total - per * sizesArr.length;
  const map = {};
  sizesArr.forEach((s, i) => {
    map[s] = per + (i === 0 ? rem : 0);
  });
  return map;
}

export default function ProductForm({ isOpen, onClose, onSubmit, initialProduct }) {
  const [form, setForm] = useState(EMPTY);
  const [sizeStockMap, setSizeStockMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showNamingTool, setShowNamingTool] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    if (initialProduct) {
      const sizesArr = initialProduct.sizes || [];
      setForm({
        name: initialProduct.name,
        brand: initialProduct.brand,
        category: initialProduct.category,
        price: initialProduct.price,
        mrp: initialProduct.mrp || "",
        description: initialProduct.description || "",
        stock: initialProduct.stock,
        sizes: sizesArr.join(","),
        image: initialProduct.images?.[0] || "",
        localName: initialProduct.localName || "",
        localDescription: initialProduct.localDescription || "",
        globalName: initialProduct.globalName || "",
        globalDescription: initialProduct.globalDescription || "",
        namingPrimary: "original",
      });
      const existingMap = {};
      (initialProduct.sizeStock || []).forEach((s) => {
        existingMap[s.size] = s.quantity;
      });
      setSizeStockMap(Object.keys(existingMap).length ? existingMap : evenSplit(sizesArr, initialProduct.stock || 0));
    } else {
      setForm(EMPTY);
      setSizeStockMap(evenSplit(["S", "M", "L", "XL"], 50));
    }
    setError("");
    setShowNamingTool(false);
  }, [isOpen, initialProduct]);

  const sizesArr = useMemo(() => form.sizes.split(",").map((s) => s.trim()).filter(Boolean), [form.sizes]);

  // Keep the per-size stock inputs in sync whenever the sizes list changes
  // (new size added -> default it in; removed size -> drop it).
  useEffect(() => {
    setSizeStockMap((prev) => {
      const next = {};
      sizesArr.forEach((s) => {
        next[s] = prev[s] !== undefined ? prev[s] : 10;
      });
      return next;
    });
  }, [form.sizes]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOpen) return null;

  function applyNaming(result) {
    setForm((f) => ({ ...f, ...result, namingPrimary: f.namingPrimary === "original" ? "global" : f.namingPrimary }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const totalStock = sizesArr.reduce((sum, s) => sum + (Number(sizeStockMap[s]) || 0), 0);
      const primaryName = form.namingPrimary === "local" ? form.localName : form.namingPrimary === "global" ? form.globalName : form.name;
      const primaryDescription =
        form.namingPrimary === "local" ? form.localDescription : form.namingPrimary === "global" ? form.globalDescription : form.description;

      await onSubmit({
        name: primaryName || form.name,
        brand: form.brand,
        category: form.category,
        description: primaryDescription || form.description,
        price: Number(form.price),
        mrp: form.mrp ? Number(form.mrp) : undefined,
        stock: totalStock || Number(form.stock) || 50,
        sizes: sizesArr,
        sizeStock: sizesArr.map((s) => ({ size: s, quantity: Number(sizeStockMap[s]) || 0 })),
        images: form.image ? [form.image] : undefined,
        localName: form.localName,
        localDescription: form.localDescription,
        globalName: form.globalName,
        globalDescription: form.globalDescription,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const hasBothNamings = form.localName && form.globalName;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{initialProduct ? "Edit product" : "Add a product"}</h2>
          <button onClick={onClose} className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <ImageUploadField value={form.image} onChange={(v) => setForm({ ...form, image: v })} />

          <Field label="Product name" required value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Brand" required value={form.brand} onChange={(v) => setForm({ ...form, brand: v })} />

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Category</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)" type="number" required value={form.price} onChange={(v) => setForm({ ...form, price: v })} />
            <Field label="MRP (₹)" type="number" value={form.mrp} onChange={(v) => setForm({ ...form, mrp: v })} />
          </div>

          <Field label="Sizes (comma-separated)" value={form.sizes} onChange={(v) => setForm({ ...form, sizes: v })} />

          <div>
            <span className="mb-1 block text-xs font-semibold text-gray-500">Stock per size</span>
            <div className="flex flex-wrap gap-2">
              {sizesArr.map((s) => (
                <label key={s} className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2 py-1">
                  <span className="text-xs font-semibold text-gray-500">{s}</span>
                  <input
                    type="number"
                    min="0"
                    value={sizeStockMap[s] ?? 0}
                    onChange={(e) => setSizeStockMap((m) => ({ ...m, [s]: e.target.value }))}
                    className="w-14 rounded border-none bg-gray-50 px-1.5 py-0.5 text-sm outline-none"
                  />
                </label>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-gray-500">Description</span>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>

          {!showNamingTool ? (
            <button
              type="button"
              onClick={() => setShowNamingTool(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-500 hover:underline"
            >
              <Sparkles className="h-3.5 w-3.5" /> Not sure how to list this for shoppers outside your region?
            </button>
          ) : (
            <SellerProductNamingTool imageDataUrl={form.image} category={form.category} onGenerated={applyNaming} />
          )}

          {hasBothNamings ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <p className="mb-1.5 text-xs font-semibold text-gray-500">Which name should shoppers see by default?</p>
              <div className="flex gap-2 text-xs">
                {[
                  { key: "local", label: `Local: "${form.localName}"` },
                  { key: "global", label: `Global: "${form.globalName}"` },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, namingPrimary: opt.key }))}
                    className={`rounded-full px-2.5 py-1 font-medium ${
                      form.namingPrimary === opt.key ? "bg-brand-500 text-white" : "bg-white text-gray-600 border border-gray-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                Either way, shoppers get a toggle to switch — see it live on the product card.
              </p>
            </div>
          ) : null}

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button type="submit" className="w-full" loading={saving}>
            {initialProduct ? "Save changes" : "Add product"}
          </Button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...rest }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-gray-500">{label}</span>
      <input
        {...rest}
        onChange={(e) => rest.onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
    </label>
  );
}
