// Turns a File (from an <input type="file"> or drag-drop) into a compressed
// base64 data URL, entirely in the browser — no multer/S3/disk storage needed
// on the server, since Product.images just stores strings (see
// server/controllers/productController.js). Resizing client-side also keeps
// the payload well under the server's 10mb JSON limit and MongoDB's 16MB
// document limit even for a phone photo straight out of the camera.
const MAX_DIMENSION = 1000;
const JPEG_QUALITY = 0.78;

export function compressImageFile(file, { maxDimension = MAX_DIMENSION, quality = JPEG_QUALITY } = {}) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type?.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Could not read that image."));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

// Splits a data URL into the raw base64 payload + mime type, for endpoints
// (like AI product naming) that need them separately rather than as one string.
export function splitDataUrl(dataUrl) {
  const match = /^data:([^;]+);base64,(.*)$/.exec(dataUrl || "");
  if (!match) return { mimeType: "", base64: "" };
  return { mimeType: match[1], base64: match[2] };
}
