import { describe, expect, it } from 'vitest'
import { generateBadgeSvg } from './badge'

describe('generateBadgeSvg', () => {
  it('generates a clean SVG badge for Level 2 Lulus', () => {
    const svg = generateBadgeSvg({ level: 2 })
    expect(svg).toContain('<svg')
    expect(svg).toContain('DEVVERSE')
    expect(svg).toContain('LEVEL 2 LULUS')
    expect(svg).toContain('#63D9C6') // Pass color
  })

  it('generates a clean SVG badge for unreached Level 1', () => {
    const svg = generateBadgeSvg({ level: null })
    expect(svg).toContain('LEVEL 1 BELUM')
    expect(svg).toContain('#83918E')
  })
})
