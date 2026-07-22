import type { Area } from "react-easy-crop";

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Görsel yüklenemedi")),
    );
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });
}

/** Kırpılmış görseli JPEG blob olarak üretir (max genişlik 1080px, %85 kalite). */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  maxWidth = 1080,
  quality = 0.85,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas oluşturulamadı");
  }

  let outputWidth = pixelCrop.width;
  let outputHeight = pixelCrop.height;

  if (outputWidth > maxWidth) {
    const scale = maxWidth / outputWidth;
    outputWidth = maxWidth;
    outputHeight = Math.round(pixelCrop.height * scale);
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
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
