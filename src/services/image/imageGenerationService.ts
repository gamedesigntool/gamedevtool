const POLLINATIONS_IMAGE_BASE_URL = "https://image.pollinations.ai/prompt/";
const POLLINATIONS_IMAGE_WIDTH = 640;
const POLLINATIONS_IMAGE_HEIGHT = 360;
const POLLINATIONS_MAX_SEED = 99999;

function buildPollinationsImageUrl(prompt: string): string {
  const seed = Math.floor(Math.random() * POLLINATIONS_MAX_SEED);
  return `${POLLINATIONS_IMAGE_BASE_URL}${encodeURIComponent(prompt)}?width=${POLLINATIONS_IMAGE_WIDTH}&height=${POLLINATIONS_IMAGE_HEIGHT}&nologo=true&seed=${seed}`;
}

function preloadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error("Image generation failed."));
    img.src = url;
  });
}

export function generateImageUrl(prompt: string): Promise<string> {
  return preloadImage(buildPollinationsImageUrl(prompt));
}
