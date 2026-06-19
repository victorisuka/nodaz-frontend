const fallbackImage = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0f766e"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#g)" rx="36"/>
  <circle cx="620" cy="160" r="92" fill="rgba(255,255,255,0.18)"/>
  <circle cx="190" cy="470" r="120" fill="rgba(255,255,255,0.12)"/>
  <text x="80" y="280" fill="#ffffff" font-family="Arial, sans-serif" font-size="68" font-weight="700">Nodaz Product</text>
  <text x="82" y="350" fill="#ecfeff" font-family="Arial, sans-serif" font-size="28">Image unavailable in current dataset</text>
</svg>
`)

export function getProductImageUrl(imageUrl) {
  return imageUrl && imageUrl.trim()
    ? imageUrl
    : `data:image/svg+xml;charset=UTF-8,${fallbackImage}`
}