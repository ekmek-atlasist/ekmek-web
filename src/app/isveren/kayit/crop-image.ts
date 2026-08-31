import type { Area } from "react-easy-crop";

/** Mobil işveren kartı ile aynı oran (710×473) */
export const EMPLOYER_LOGO_ASPECT = 710 / 473;

export const EMPLOYER_LOGO_OUTPUT_WIDTH = 1420;
export const EMPLOYER_LOGO_OUTPUT_HEIGHT = 946;

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Görsel yüklenemedi")),
    );

    // blob:/data: URL'lerde crossOrigin canvas'ı bozar
    if (!url.startsWith("blob:") && !url.startsWith("data:")) {
      image.crossOrigin = "anonymous";
    }

    image.src = url;
  });
}

function normalizeCropArea(pixelCrop: Area): Area {
  return {
    x: Math.max(0, Math.round(pixelCrop.x)),
    y: Math.max(0, Math.round(pixelCrop.y)),
    width: Math.max(1, Math.round(pixelCrop.width)),
    height: Math.max(1, Math.round(pixelCrop.height)),
  };
}

/** Kırpılmış görseli mobil kart oranında JPEG blob olarak üretir (1420×946, %85 kalite). */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth = EMPLOYER_LOGO_OUTPUT_WIDTH,
  outputHeight = EMPLOYER_LOGO_OUTPUT_HEIGHT,
  quality = 0.85,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const crop = normalizeCropArea(pixelCrop);

  if (crop.x + crop.width > image.naturalWidth || crop.y + crop.height > image.naturalHeight) {
    throw new Error("Kırpma alanı görsel sınırlarının dışında");
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas oluşturulamadı");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Görsel işlenemedi"));
      },
      "image/jpeg",
      quality,
    );
  });
}
