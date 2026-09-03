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

describe('client plugin contract', () => {
  it('exports client inject and installs slots & locale', async () => {
    const { apply: clientApply, inject: clientInject } = await import('../src/client/index.tsx')
    expect(clientInject).toEqual(['slots', 'locale'])

    let registeredSlot: any
    const ctx = {
      effect: vi.fn((fn: () => unknown) => fn()),
      locale: {
        register: vi.fn(),
        bind: vi.fn(() => vi.fn((key: string) => key)),
      },
      slots: {
        inject: vi.fn((_name: string, callback: () => unknown) => callback()),
        register: vi.fn((opts: unknown, comp: unknown) => {
          registeredSlot = { opts, comp }
          return vi.fn()
        }),
      },
    }

    clientApply(ctx as never)
    expect(ctx.locale.register).toHaveBeenCalledWith('dsh-plugin-template', expect.any(Object))
    expect(ctx.slots.inject).toHaveBeenCalledWith('settings.plugin.item', expect.any(Function))
    expect(registeredSlot.opts.name).toBe('settings.plugin.item')
    expect(registeredSlot.opts.key).toBe('dsh-plugin-template')
  })
})
