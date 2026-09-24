import { describe, expect, it, vi } from 'vitest'
import { apply, Config, inject, name } from '../src/index.ts'

function register(config: Config) {
  let tool: any
  const ctx = { tools: { register: vi.fn((value) => { tool = value; return vi.fn() }) } }
  apply(ctx as never, config)
  return { tool, ctx }
}

describe('host plugin contract', () => {
  it('exports the Cordis shape and parses a default volatile field', () => {
    expect(name).toBe('dsh-plugin-template')
    expect(inject).toEqual(['tools'])
    expect(Config({}).prefix.get()).toBe('Hello')
    expect(Config.dict?.prefix?.meta.volatile).toBe(true)
    // @ts-expect-error Deliberately invalid input must also fail runtime validation.
    expect(() => Config({ prefix: 42 })).toThrow()
  })

  it('registers a strict rendered tool without the removed settings service', async () => {
    const { tool, ctx } = register(Config({ prefix: 'Hi' }))
    expect(ctx.tools.register).toHaveBeenCalledOnce()
    expect(tool.name).toBe('template_greet')
    expect(tool.output.schema.additionalProperties).toBe(false)
    const result = await tool.execute({ name: 'DSH' }, {})
    expect(result).toEqual({ greeting: 'Hi, DSH!' })
    expect(tool.output.render({ name: 'DSH' }, result)).toEqual([{ type: 'text', text: 'Hi, DSH!' }])
  })

  it('reads the current volatile snapshot for every execution', async () => {
    let prefix = 'Hello'
    const { tool, ctx } = register({ prefix: { get: () => prefix } })
    expect(await tool.execute({ name: 'World' }, {})).toEqual({ greeting: 'Hello, World!' })
    prefix = 'Greetings'
    expect(await tool.execute({ name: 'World' }, {})).toEqual({ greeting: 'Greetings, World!' })
    expect(ctx.tools.register).toHaveBeenCalledOnce()
  })
})

describe('client plugin contract', () => {
  it('registers typed bundle configuration and lets the renderer supply locale', async () => {
    const { apply: clientApply, inject: clientInject } = await import('../src/client/index.tsx')
    expect(clientInject).toEqual(['slots', 'locale'])
    const disposeLocale = vi.fn()
    const disposers: unknown[] = []
    let registeredSlot: any
    const ctx = {
      effect: vi.fn((fn: () => unknown) => { disposers.push(fn()) }),
      locale: { register: vi.fn(() => disposeLocale) },
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
    expect(disposers).toContain(disposeLocale)
    expect(ctx.slots.inject).toHaveBeenCalledWith('plugins.bundle.config', expect.any(Function))
    expect(registeredSlot.opts).toEqual({ name: 'plugins.bundle.config', key: 'dsh-plugin-template', locale: 'dsh-plugin-template' })
    const t = (key: string) => key
    expect(registeredSlot.comp({ t, view: 'page' }).type).toBe('section')
    expect(registeredSlot.comp({ t, view: 'summary' }).props.children).toBe('description')
  })
})
