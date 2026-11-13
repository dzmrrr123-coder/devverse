export type BadgeData = {
  level: number | null
  label?: string
  state?: 'lulus' | 'belum' | 'unknown'
}

/**
 * Menghasilkan SVG badge kesiapan Devverse untuk dipasang di README GitHub.
 * Desain presisi, tajam di layar Retina, ramah mode gelap.
 */
export function generateBadgeSvg(data: BadgeData): string {
  const levelText = data.level ? `LEVEL ${data.level} LULUS` : 'LEVEL 1 BELUM'
  const isPass = data.level && data.level >= 1
  const colorPass = '#63D9C6'
  const colorSignal = '#F2B267'
  const colorQuiet = '#83918E'
  const stateColor = isPass ? colorPass : (data.level === null ? colorQuiet : colorSignal)

  // Hitung lebar teks secara deterministik
  const leftText = 'DEVVERSE'
  const leftWidth = 74
  const rightText = levelText
  const rightWidth = 104
  const totalWidth = leftWidth + rightWidth
  const height = 24

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" viewBox="0 0 ${totalWidth} ${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="2" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <!-- Left Background -->
    <rect width="${leftWidth}" height="${height}" fill="#0B1013"/>
    <!-- Right Background -->
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="#121A1E"/>
    <!-- Border Line -->
    <rect width="${totalWidth}" height="${height}" fill="none" stroke="#263236" stroke-width="1"/>
  </g>
  <!-- State Square Indicator -->
  <rect x="8" y="9" width="6" height="6" fill="${stateColor}"/>
  <g fill="#EFF3F1" text-anchor="middle" font-family="'IBM Plex Mono',ui-monospace,Menlo,monospace" font-size="10" font-weight="600" letter-spacing="0.08em">
    <text x="44" y="16">${leftText}</text>
  </g>
  <g fill="${stateColor}" text-anchor="middle" font-family="'IBM Plex Mono',ui-monospace,Menlo,monospace" font-size="10" font-weight="700" letter-spacing="0.06em">
    <text x="${leftWidth + rightWidth / 2}" y="16">${rightText}</text>
  </g>
</svg>`
}
