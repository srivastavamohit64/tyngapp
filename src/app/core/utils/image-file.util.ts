/**
 * Android camera captures often arrive as blobs named "image" / "blob"
 * with an empty or generic MIME type. Laravel's image/mimes rules reject those.
 * Normalize to a JPEG File with a real filename before FormData upload.
 */
export async function normalizeImageFile(file: File, namePrefix = 'photo'): Promise<File> {
  const type = (file.type || '').toLowerCase();
  const safeName = (file.name || '').trim();
  const hasImageExt = /\.(jpe?g|png|webp)$/i.test(safeName);
  const knownType = type === 'image/jpeg' || type === 'image/jpg' || type === 'image/png' || type === 'image/webp';

  if (knownType && hasImageExt && safeName && safeName !== 'image' && safeName !== 'blob') {
    return file;
  }

  if (knownType && (!hasImageExt || !safeName || safeName === 'image' || safeName === 'blob')) {
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg';
    return new File([file], `${namePrefix}-${Date.now()}.${ext}`, {
      type: type === 'image/jpg' ? 'image/jpeg' : type,
      lastModified: file.lastModified || Date.now(),
    });
  }

  return blobToJpegFile(file, `${namePrefix}-${Date.now()}.jpg`);
}

export async function fetchWebPathAsImageFile(webPath: string, namePrefix = 'photo'): Promise<File> {
  const response = await fetch(webPath);
  const blob = await response.blob();
  const guessed = blob.type && blob.type.startsWith('image/')
    ? blob.type
    : 'image/jpeg';
  const raw = new File([blob], `${namePrefix}.jpg`, { type: guessed, lastModified: Date.now() });
  return normalizeImageFile(raw, namePrefix);
}

async function blobToJpegFile(source: Blob, fileName: string): Promise<File> {
  const bitmap = await createImageBitmap(source);
  try {
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to process camera image.');
    }
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error('Unable to encode camera image.'))),
        'image/jpeg',
        0.85,
      );
    });

    return new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });
  } finally {
    bitmap.close();
  }
}
