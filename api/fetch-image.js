// api/fetch-image.js
// Serverless endpoint: fetches an image from remote URL and returns base64 data URL.
// Use cautiously: for production, consider size limits and validate/allowlist domains.

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024
const DEFAULT_TIMEOUT_MS = 8000

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase()
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return true
  if (host.startsWith('127.')) return true
  if (host.startsWith('10.')) return true
  if (host.startsWith('192.168.')) return true
  const parts = host.split('.')
  if (parts.length === 4) {
    const first = Number(parts[0])
    const second = Number(parts[1])
    if (first === 172 && second >= 16 && second <= 31) return true
  }
  return false
}

function isAllowedHost(hostname) {
  const allowList = String(process.env.ALLOWED_IMAGE_HOSTS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  if (allowList.length === 0) return true
  return allowList.includes(hostname.toLowerCase())
}

async function readStreamWithLimit(stream, maxBytes) {
  const reader = stream.getReader()
  const chunks = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      throw new Error('Image too large')
    }
    chunks.push(value)
  }
  const merged = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    merged.set(chunk, offset)
    offset += chunk.byteLength
  }
  return merged.buffer
}

export default async function handler(req, res) {
  const url = req.query.url
  if (!url) return res.status(400).json({ error: 'Missing url' })

  let parsed
  try {
    parsed = new URL(String(url))
  } catch {
    return res.status(400).json({ error: 'Invalid url' })
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Invalid protocol' })
  }
  if (isPrivateHost(parsed.hostname)) {
    return res.status(400).json({ error: 'Blocked host' })
  }
  if (!isAllowedHost(parsed.hostname)) {
    return res.status(403).json({ error: 'Host not allowed' })
  }

  const maxBytes = Number(process.env.MAX_IMAGE_BYTES || DEFAULT_MAX_BYTES)
  const timeoutMs = Number(process.env.FETCH_TIMEOUT_MS || DEFAULT_TIMEOUT_MS)
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const r = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'open-aac/1.0' },
      signal: controller.signal
    })
    if (!r.ok) return res.status(502).json({ error: 'failed to fetch' })

    const contentType = r.headers.get('content-type') || 'image/jpeg'
    const contentLength = Number(r.headers.get('content-length') || 0)
    if (contentLength && contentLength > maxBytes) {
      return res.status(413).json({ error: 'Image too large' })
    }

    if (!r.body) {
      return res.status(502).json({ error: 'No response body' })
    }

    const buffer = await readStreamWithLimit(r.body, maxBytes)
    const base64 = Buffer.from(buffer).toString('base64')
    const dataUrl = `data:${contentType};base64,${base64}`
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'public, max-age=86400')
    return res.status(200).json({ contentType, base64: dataUrl })
  } catch (err) {
    if (err && String(err).includes('Image too large')) {
      return res.status(413).json({ error: 'Image too large' })
    }
    if (err && String(err).includes('AbortError')) {
      return res.status(504).json({ error: 'Fetch timed out' })
    }
    console.error(err)
    return res.status(500).json({ error: 'fetch error' })
  } finally {
    clearTimeout(timeoutId)
  }
}
