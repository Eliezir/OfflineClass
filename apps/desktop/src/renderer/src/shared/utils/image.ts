/** Read + downscale an image file to a compact data URL (WebP) for inline,
    offline-first storage on a question. Bounds the largest side to `maxDim`. */
export async function fileToDataUrl(file: File, maxDim = 1280, quality = 0.82): Promise<string> {
  const source = await readAsDataUrl(file)
  const img = await loadImage(source)

  const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
  const width = Math.max(1, Math.round(img.width * scale))
  const height = Math.max(1, Math.round(img.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return source
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/webp', quality)
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('read failed'))
    reader.readAsDataURL(file)
  })
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('image load failed'))
    img.src = src
  })
}
