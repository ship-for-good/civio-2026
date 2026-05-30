import { describe, it, expect } from 'vitest'
import { toISODate } from './dates.js'

describe('toISODate', () => {
  it('should_format_date_as_iso_yyyy_mm_dd', () => {
    // Use a known local date — avoid timezone shifts
    const d = new Date(2026, 4, 30) // month is 0-indexed: 4 = May
    expect(toISODate(d)).toBe('2026-05-30')
  })

  it('should_zero_pad_month_and_day', () => {
    const d = new Date(2026, 0, 5) // Jan 5
    expect(toISODate(d)).toBe('2026-01-05')
  })
})
