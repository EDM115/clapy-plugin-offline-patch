import { env } from '../../environment/env';

const IMGBB_API_ENDPOINT = 'https://api.imgbb.com/1/upload';

type ImgbbSuccess = {
  data: {
    id: string;
    title: string;
    url_viewer: string;
    url: string; // direct image URL (i.ibb.co)
    display_url: string; // alternate CDN URL
    width: string;
    height: string;
    size: string;
    time: string;
    expiration: string;
    image: { filename: string; name: string; mime: string; extension: string; url: string };
    thumb?: { url: string };
    medium?: { url: string };
    delete_url?: string;
  };
  success: true;
  status: number;
};

type ImgbbError = {
  data?: unknown;
  error?: { message?: string; code?: number };
  success: false;
  status: number;
};

export async function uploadAssetFromUintArrayRaw(fileUint: Uint8Array, imageHash: string) {
  const blob = new Blob([fileUint]);
  return uploadAsset(blob, imageHash);
}

export async function uploadAssetFromUrl(url: string, imageHash: string) {
  return uploadAsset(url, imageHash);
}

async function uploadAsset(file: Blob | string, imageHash: string): Promise<string> {
  const formData = new FormData();

  // imgbb expects the "image" field to be either:
  // - a binary file (Blob/File) via multipart/form-data
  // - a URL string
  // - a base64 string
  if (typeof file === 'string') {
    // URL string
    formData.append('image', file);
  } else {
    // Binary upload
    // (optional third arg sets filename; we also send "name" separately)
    formData.append('image', file, `${imageHash}`);
  }

  // optional but nice to have: the asset name
  formData.append('name', imageHash);

  const endpoint = `${IMGBB_API_ENDPOINT}?key=${encodeURIComponent(env.imgbbApiKey)}&expiration=86400`; // 24 hours

  const res = await fetch(endpoint, { method: 'POST', body: formData });
  let payload: ImgbbSuccess | ImgbbError;

  try {
    payload = (await res.json()) as ImgbbSuccess | ImgbbError;
  } catch {
    throw new Error(`Unexpected response from image host (non-JSON, status ${res.status}).`);
  }

  if (!('success' in payload) || payload.success !== true) {
    const msg =
      (payload as ImgbbError)?.error?.message ?? `Image upload failed with status ${payload?.status ?? res.status}.`;

    // Map common size error to a clearer message (imgbb limit is 32 MB)
    const pretty =
      msg.toLowerCase().includes('file too large') || msg.toLowerCase().includes('size')
        ? `One of the images exceeds 32 MB, which is not supported. Please compress and retry.`
        : `${msg} (image host response)`;

    throw new Error(pretty);
  }

  const url = payload.data?.url || payload.data?.display_url;
  if (!url) {
    throw new Error(`BUG Missing imgbb response URL. Response: ${JSON.stringify(payload)}`);
  }

  return url;
}
