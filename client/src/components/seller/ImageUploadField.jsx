import { useRef, useState } from "react";
import { ImagePlus, X, Loader2 } from "lucide-react";
import { compressImageFile } from "../../utils/imageCompress";

// Turns a photo into a compressed base64 data URL entirely client-side —
// Product.images is just an array of strings, so this needs zero backend
// file-storage setup (no multer, no S3, no static file serving) to work.
export default function ImageUploadField({ value, onChange, label = "Product photo" }) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const dataUrl = await compressImageFile(file);
      onChange(dataUrl);
    } catch (err) {
      setError(err.message || "Could not process that image.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      {value ? (
        <div className="relative inline-block">
          <img src={value} alt="Preview" className="h-32 w-28 rounded-xl object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 text-white shadow"
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="flex h-32 w-28 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-brand-300 hover:text-brand-400"
        >
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
          <span className="text-[11px] font-medium">{loading ? "Processing..." : "Upload photo"}</span>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
