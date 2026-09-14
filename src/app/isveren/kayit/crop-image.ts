import type { Area } from "react-easy-crop";

/** Mobil işveren kartı ile aynı oran (710×473) */
export const EMPLOYER_LOGO_ASPECT = 710 / 473;

export const EMPLOYER_LOGO_OUTPUT_WIDTH = 1420;
export const EMPLOYER_LOGO_OUTPUT_HEIGHT = 946;

export type LogoUploadMode = "cover" | "contain";

export type LogoImageAnalysis = {
  width: number;
  height: number;
  aspect: number;
  hasTransparency: boolean;
  suggestedMode: LogoUploadMode;
  suggestedBackground: string;
};

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", () =>
      reject(new Error("Görsel yüklenemedi")),
    );

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

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((value) => Math.max(0, Math.min(255, value)).toString(16).padStart(2, "0"))
    .join("")}`;
}

async function imageHasTransparency(
  image: HTMLImageElement,
): Promise<boolean> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.min(image.naturalWidth, 64);
  canvas.height = Math.min(image.naturalHeight, 64);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return false;

  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 250) return true;
  }

  return false;
}

function quantizeChannel(value: number): number {
  return Math.round(value / 12) * 12;
}

function countSampledColor(
  counts: Map<string, number>,
  r: number,
  g: number,
  b: number,
  weight: number,
): void {
  const key = `${quantizeChannel(r)},${quantizeChannel(g)},${quantizeChannel(b)}`;
  counts.set(key, (counts.get(key) ?? 0) + weight);
}

function dominantColorFromCounts(counts: Map<string, number>): string | null {
  if (counts.size === 0) return null;

  let bestKey = "";
  let bestCount = 0;

  for (const [key, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestKey = key;
    }
  }

  const [r, g, b] = bestKey.split(",").map(Number);
  return rgbToHex(r, g, b);
}

async function detectBackgroundColor(image: HTMLImageElement): Promise<string> {
  const sampleSize = 72;
  const canvas = document.createElement("canvas");
  canvas.width = sampleSize;
  canvas.height = sampleSize;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return "#ffffff";

  ctx.drawImage(image, 0, 0, sampleSize, sampleSize);
  const { data, width, height } = ctx.getImageData(0, 0, sampleSize, sampleSize);
  const borderCounts = new Map<string, number>();
  const allOpaqueCounts = new Map<string, number>();

  function samplePixel(
    counts: Map<string, number>,
    x: number,
    y: number,
    weight: number,
  ): void {
    const index = (y * width + x) * 4;
    const alpha = data[index + 3];
    if (alpha < 140) return;

    countSampledColor(
      counts,
      data[index],
      data[index + 1],
      data[index + 2],
      weight,
    );
  }

  const borderThickness = Math.max(2, Math.round(sampleSize * 0.08));

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const onBorder =
        x < borderThickness ||
        x >= width - borderThickness ||
        y < borderThickness ||
        y >= height - borderThickness;

      if (onBorder) {
        samplePixel(borderCounts, x, y, 3);
      }
    }
  }

  const borderColor = dominantColorFromCounts(borderCounts);
  if (borderColor) return borderColor;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      samplePixel(allOpaqueCounts, x, y, 1);
    }
  }

  return dominantColorFromCounts(allOpaqueCounts) ?? "#ffffff";
}

export async function analyzeLogoImage(
  imageSrc: string,
): Promise<LogoImageAnalysis> {
  const image = await createImage(imageSrc);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  const aspect = width / height;
  const hasTransparency = await imageHasTransparency(image);
  const suggestedBackground = await detectBackgroundColor(image);

  const aspectDiff = Math.abs(aspect - EMPLOYER_LOGO_ASPECT);
  const suggestedMode: LogoUploadMode =
    hasTransparency || aspect > 1.85 || aspect < 1.15 || aspectDiff > 0.35
      ? "contain"
      : "cover";

  return {
    width,
    height,
    aspect,
    hasTransparency,
    suggestedMode,
    suggestedBackground,
  };
}

/** Kırpılmış görseli mobil kart oranında JPEG blob olarak üretir. */
export async function getCroppedImageBlob(
  imageSrc: string,
  pixelCrop: Area,
  outputWidth = EMPLOYER_LOGO_OUTPUT_WIDTH,
  outputHeight = EMPLOYER_LOGO_OUTPUT_HEIGHT,
  quality = 0.85,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const crop = normalizeCropArea(pixelCrop);

  if (
    crop.x + crop.width > image.naturalWidth ||
    crop.y + crop.height > image.naturalHeight
  ) {
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

  return canvasToBlob(canvas, "image/jpeg", quality);
}

/** Logoyu kesmeden çerçeveye sığdırır; mobil kart oranı korunur. */
export async function getContainedLogoBlob(
  imageSrc: string,
  backgroundColor: string,
  outputWidth = EMPLOYER_LOGO_OUTPUT_WIDTH,
  outputHeight = EMPLOYER_LOGO_OUTPUT_HEIGHT,
  quality = 0.88,
): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas oluşturulamadı");
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, outputWidth, outputHeight);

  const scale = Math.min(
    outputWidth / image.naturalWidth,
    outputHeight / image.naturalHeight,
  );
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = (outputWidth - drawWidth) / 2;
  const offsetY = (outputHeight - drawHeight) / 2;

  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const mimeType = backgroundColor === "transparent" ? "image/png" : "image/jpeg";
  return canvasToBlob(canvas, mimeType, quality);
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Görsel işlenemedi"));
      },
      mimeType,
      quality,
    );
  });
}
