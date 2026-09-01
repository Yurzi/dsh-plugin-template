import { describe, expect, it, vi } from 'vitest'
import { apply, Config, inject, name } from '../src/index.ts'

describe('host plugin contract', () => {
  it('exports the Cordis plugin shape', () => {
    expect(name).toBe('dsh-plugin-template')
    expect(inject).toEqual(['tools'])
    expect(Config).toBeDefined()
  })

  it('registers a strict, rendered tool and executes with static config', async () => {
    let tool: any
    const ctx = {
      tools: { register: vi.fn((value) => { tool = value; return vi.fn() }) },
      inject: vi.fn(),
      effect: vi.fn(),
    }
    apply(ctx as never, { prefix: 'Hi' })
    expect(tool.name).toBe('template_greet')
    expect(tool.output.schema.additionalProperties).toBe(false)
    expect(await tool.execute({ name: 'DSH' }, {})).toEqual({ greeting: 'Hi, DSH!' })
  })

  it('attaches settings.installSection and updates prefix dynamically when settings service is present', async () => {
    let tool: any
    let settingsCallback: any
    let sourceSink: any

    const settingsService = {
      installSection: vi.fn((_owner, ns, _schema, _entry, hooks) => {
        expect(ns).toBe('dsh-plugin-template')
        expect(typeof hooks.onChange).toBe('function')
        hooks.onChange()
        sourceSink = hooks.setSource
      }),
    }

    const ctx = {
      tools: { register: vi.fn((value) => { tool = value; return vi.fn() }) },
      inject: vi.fn((deps, callback) => {
        if (deps.includes('settings')) {
          settingsCallback = callback
        }
      }),
      effect: vi.fn(),
    }

    apply(ctx as never, { prefix: 'Hello' })

    // Simulate settings service presence
    expect(ctx.inject).toHaveBeenCalledWith(['settings'], expect.any(Function))
    settingsCallback({ settings: settingsService })
    expect(settingsService.installSection).toHaveBeenCalledOnce()

    // Initial greeting
    expect(await tool.execute({ name: 'World' }, {})).toEqual({ greeting: 'Hello, World!' })

    // Dynamic config update from settings document
    sourceSink(() => ({ prefix: 'Greetings' }))
    expect(await tool.execute({ name: 'World' }, {})).toEqual({ greeting: 'Greetings, World!' })
  })
})
