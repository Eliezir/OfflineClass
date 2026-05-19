import QRCode from 'qrcode'

export async function makeQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    margin: 1,
    width: 256,
    errorCorrectionLevel: 'M'
  })
}
