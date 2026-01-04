// api/search-pixabay.js
// Serverless endpoint: search Pixabay with safer defaults and expanded filters.
// Make sure PIXABAY_KEY is set in the environment.
//
// Notes:
// - Forces safesearch=true (only age-appropriate images).
// - Requests image_type=all to include photos, illustrations, vectors.
// - Accepts optional query parameters (orientation, category, colors, min_width, min_height,
//   editors_choice, order, page, per_page, lang) and validates them.
//
// Example usage:
// /api/search-pixabay?q=cat&page=1&per_page=30&orientation=horizontal&colors=blue&category=animals

export default async function handler(req, res) {
  try {
    const PIXABAY_KEY = process.env.PIXABAY_KEY
    if (!PIXABAY_KEY) {
      return res.status(500).json({ error: 'Missing PIXABAY_KEY in environment' })
    }

    const {
      q = '',
      lang = 'en',
      orientation = 'all', // all | horizontal | vertical
      category,
      min_width,
      min_height,
      colors,
      editors_choice = 'false',
      order = 'popular', // popular | latest
      page = '1',
      per_page = '30'
    } = req.query

    // Validate and normalize page / per_page
    let pageNum = parseInt(String(page || '1'), 10)
    let perPageNum = parseInt(String(per_page || '30'), 10)
    if (isNaN(pageNum) || pageNum < 1) pageNum = 1
    if (isNaN(perPageNum) || perPageNum < 3) perPageNum = 20
    if (perPageNum > 200) perPageNum = 200

    // Build params
    const params = new URLSearchParams({
      key: PIXABAY_KEY,
      q: String(q).slice(0, 100),
      lang: String(lang),
      image_type: 'all',        // include photo, illustration, vector
      safesearch: 'true',       // force safe search
      orientation: String(orientation || 'all'),
      editors_choice: String(editors_choice || 'false'),
      order: String(order || 'popular'),
      page: String(pageNum),
      per_page: String(perPageNum)
    })

    // Optional filters
    if (category) params.set('category', String(category))
    if (min_width) params.set('min_width', String(min_width))
    if (min_height) params.set('min_height', String(min_height))
    if (colors) params.set('colors', String(colors)) // comma-separated allowed values

    const url = `https://pixabay.com/api/?${params.toString()}`

    const r = await fetch(url)
    if (!r.ok) {
      const txt = await r.text()
      console.error('Pixabay error', r.status, txt)
      return res.status(502).json({ error: 'Pixabay API error', status: r.status, details: txt })
    }

    const j = await r.json()

    // Map results to your client-facing shape (keep same fields as before)
    const hits = (j.hits || []).map(h => ({
      id: h.id,
      thumbnail: h.previewURL,
      original: h.largeImageURL || h.webformatURL || h.fullHDURL || h.imageURL,
      width: h.imageWidth,
      height: h.imageHeight,
      source: 'Pixabay',
      author: h.user || '',
      pageUrl: h.pageURL || '',
      license: 'Pixabay',
      type: h.type || '', // "photo", "illustration", etc.
      tags: h.tags || ''
    }))

    // Cache for a short time on CDN / edge
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120')
    return res.status(200).json({ total: j.totalHits || 0, images: hits })
  } catch (err) {
    console.error('search-pixabay handler error', err)
    return res.status(500).json({ error: 'internal error' })
  }
}
