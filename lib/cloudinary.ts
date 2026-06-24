import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function extractPublicId(url: string): string | null {
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/);
  return match ? match[1] : null;
}

export async function deleteImages(urls: (string | undefined | null)[]) {
  const ids = urls
    .filter((u): u is string => !!u)
    .map(extractPublicId)
    .filter((id): id is string => !!id);
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => cloudinary.uploader.destroy(id)));
}

export default cloudinary;
