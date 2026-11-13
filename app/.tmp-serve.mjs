import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import server from './dist/server/server.js'

const handler = server.fetch ?? server

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? '127.0.0.1'}`)
    const headers = new Headers()
    for (const [k, v] of Object.entries(req.headers)) {
      if (Array.isArray(v)) v.forEach((x) => headers.append(k, x))
      else if (v) headers.set(k, v)
    }
    const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : Readable.toWeb(req)
    const request = new Request(url, { method: req.method, headers, body, duplex: 'half' })
    const response = await handler(request)
    res.statusCode = response.status
    for (const [k, v] of response.headers) res.setHeader(k, v)
    if (response.body) Readable.fromWeb(response.body).pipe(res)
    else res.end()
  } catch (error) {
    res.statusCode = 500
    res.end('err: ' + (error?.message ?? String(error)))
  }
}).listen(3011, '127.0.0.1', () => console.log('READY http://127.0.0.1:3011'))
