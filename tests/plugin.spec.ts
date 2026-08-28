import { describe, expect, it, vi } from 'vitest'
import { apply, Config, inject, name } from '../src/index.ts'

describe('host plugin contract', () => {
  it('exports the Cordis plugin shape', () => {
    expect(name).toBe('dsh-plugin-template')
    expect(inject).toEqual(['tools'])
    expect(Config).toBeDefined()
  })

  it('registers a strict, rendered tool', async () => {
    let tool: any
    const ctx = { tools: { register: vi.fn((value) => { tool = value; return vi.fn() }) }, effect: vi.fn() }
    apply(ctx as never, { prefix: 'Hi' })
    expect(tool.name).toBe('template_greet')
    expect(tool.output.schema.additionalProperties).toBe(false)
    expect(await tool.execute({ name: 'DSH' }, {})).toEqual({ greeting: 'Hi, DSH!' })
  })
})
