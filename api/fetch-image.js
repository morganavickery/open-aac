// api/fetch-image.js
// Serverless endpoint: fetches an image from remote URL and returns base64 data URL.
// Use cautiously: for production, consider size limits and validate/allowlist domains.

export default async function handler(req, res) {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: 'Missing url' })

  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'open-aac/1.0' } })
    if (!r.ok) return res.status(502).json({ error: 'failed to fetch' })
    const contentType = r.headers.get('content-type') || 'image/jpeg'
    const buffer = await r.arrayBuffer()
    // optional: you could resize here server-side using sharp, but serverless environments vary.
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`
    // Return also minimal metadata if you want (none available in general)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.status(200).json({ contentType, base64: dataUrl })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'fetch error' })
  }
}
