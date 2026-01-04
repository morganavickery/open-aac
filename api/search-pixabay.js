// api/search-pixabay.js
// Serverless endpoint: search Pixabay
// Ensure PIXABAY_KEY is set in environment variables
// KEY: 54050351-495c0b099fa217bdcec6c6134

export default async function handler(req, res) {
  const q = req.query.q || ''
  if (!q) return res.status(400).json({ error: 'Missing q' })

  const PIXABAY_KEY = process.env.PIXABAY_KEY
  if (!PIXABAY_KEY) return res.status(500).json({ error: 'Missing PIXABAY_KEY' })

  const params = new URLSearchParams({
    key: '54050351-495c0b099fa217bdcec6c6134',
    q,
    image_type: 'photo',
    safesearch: 'true',
    per_page: '30'
  })

  const url = `https://pixabay.com/api/?${params.toString()}`

  try {
    const r = await fetch(url)
    if (!r.ok) {
      const txt = await r.text()
      return res.status(502).json({ error: 'Pixabay error', details: txt })
    }
    const j = await r.json()
    const hits = (j.hits || []).map(h => ({
      id: h.id,
      thumbnail: h.previewURL,
      original: h.largeImageURL || h.webformatURL || h.fullHDURL || h.imageURL,
      width: h.imageWidth,
      height: h.imageHeight,
      source: 'Pixabay',
      author: h.user || '',
      pageUrl: h.pageURL || '',
      license: 'Pixabay'
    }))
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.json({ images: hits })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'search failed' })
  }
}
