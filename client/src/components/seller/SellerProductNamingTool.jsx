import { useState } from "react";
import { Sparkles, Languages, Loader2 } from "lucide-react";
import { aiService } from "../../services/aiService";
import { splitDataUrl } from "../../utils/imageCompress";

// The UI half of Bharat idea #1: a seller gives their own local name + a
// rough description + the product photo, and gets back BOTH a polished
// local presentation and a globally-recognizable one — the actual
// generation happens server-side in productNamingAI.js (Gemini vision).
// Whatever comes back is editable before the seller decides which one to
// use as the primary listing name.
export default function SellerProductNamingTool({ imageDataUrl, category, onGenerated }) {
  const [localName, setLocalName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    if (!localName.trim()) {
      setError("Enter the name you'd normally call this product first.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { base64, mimeType } = imageDataUrl ? splitDataUrl(imageDataUrl) : {};
      const result = await aiService.productNaming({
        localName: localName.trim(),
        description: description.trim(),
        category,
        imageBase64: base64 || undefined,
        mimeType: mimeType || undefined,
      });
      onGenerated(result);
    } catch (err) {
      setError(err.message || "Could not generate naming suggestions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-dashed border-brand-200 bg-brand-50/50 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold text-brand-600">
        <Languages className="h-3.5 w-3.5" />
        Get a local + global name for this product
      </div>
      <p className="mb-2 text-[11px] text-gray-500">
        Know it only by a local name? Add that below (and the photo above) — we'll suggest a polished local
        presentation AND a name/description shoppers outside your region will recognise.
      </p>
      <input
        value={localName}
        onChange={(e) => setLocalName(e.target.value)}
        placeholder='Your local name for it, e.g. "Bandhani Odhna"'
        className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Brief description (optional)"
        className="mb-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      {error ? <p className="mb-2 text-xs text-red-500">{error}</p> : null}
      <button
        type="button"
        onClick={generate}
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-500 py-2 text-xs font-semibold text-white disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
        {loading ? "Generating..." : "Generate names"}
      </button>
    </div>
  );
}
