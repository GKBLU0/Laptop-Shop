import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility', () => {
  it('merges class names correctly', () => {
    const result = cn('p-2', 'p-4')
    expect(result).toContain('p-4')
    expect(result).not.toContain('p-2')
  })

  it('handles conditional values', () => {
    const result = cn('bg-primary', true && 'text-white', false && 'hidden')
    expect(result).toContain('bg-primary')
    expect(result).toContain('text-white')
    expect(result).not.toContain('hidden')
  })

  it('handles arrays and nested conditions', () => {
    const result = cn(['bg-red-500', 'text-white'], null, undefined, 'p-4')
    expect(result).toContain('bg-red-500')
    expect(result).toContain('text-white')
    expect(result).toContain('p-4')
  })

  it('deduplicates conflicting Tailwind classes', () => {
    const result = cn('text-sm', 'text-base', 'text-lg')
    expect(result).toContain('text-lg')
    expect(result).not.toContain('text-sm')
    expect(result).not.toContain('text-base')
  })
})