export class WebPConversionError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'WebPConversionError'
    if (cause) this.cause = cause
  }
}

async function decode(file) {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch (err) {
    throw new WebPConversionError('Could not decode this file as an image.', err)
  }
}

async function encode(bitmap, quality) {
  const { width, height } = bitmap

  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0)
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality })
    return { blob, width, height }
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0)
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/webp', quality),
  )
  if (!blob) throw new WebPConversionError('Browser returned no blob from canvas.')
  return { blob, width, height }
}

export async function convertToWebP(file, quality = 0.8) {
  if (!file) throw new WebPConversionError('No file provided.')

  const bitmap = await decode(file)
  try {
    const { blob, width, height } = await encode(bitmap, quality)

    if (blob.type !== 'image/webp') {
      throw new WebPConversionError(
        'This browser does not support encoding WebP (Safari < 14 or older).',
      )
    }

    return {
      blob,
      url: URL.createObjectURL(blob),
      originalSize: file.size,
      webpSize: blob.size,
      width,
      height,
    }
  } finally {
    bitmap.close?.()
  }
}
