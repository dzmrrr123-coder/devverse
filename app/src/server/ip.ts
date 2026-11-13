import { createHash } from 'node:crypto'

/**
 * ip_hash hanya untuk pembatasan laju. Nilainya tidak pernah ditampilkan dan
 * tidak bisa dibalik menjadi alamat IP tanpa salt yang disimpan terpisah.
 */
export function hashIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const ip = forwarded || request.headers.get('x-real-ip')?.trim() || 'local'
  const salt = process.env.IP_HASH_SALT ?? 'devverse-local'
  return createHash('sha256').update(`${salt}:${ip}`).digest('hex')
}
