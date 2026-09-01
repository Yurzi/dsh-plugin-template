/** Host half of the plugin. Keep named Cordis exports; do not default-export apply. */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-plugin-template'
export const inject = ['tools']

export interface Config { readonly prefix?: string }
export const Config: z<Config> = z.object({ prefix: z.string().default('Hello') })

export function apply(ctx: Context, config: Config): void {
  let source = () => config

  // Attach optional user settings layer for DSH 0.1.2-alpha.3 settings service
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings?.installSection(ctx, name, Config, config, {
      setSource: (current) => { source = current },
      onChange: () => {},
    })
  })

  ctx.tools.register(defineTool({
    name: 'template_greet',
    description: 'Return a greeting using this plugin configuration.',
    parameters: { name: { type: 'string', required: true, description: 'Name to greet.' } },
    output: {
      schema: { type: 'object', properties: { greeting: { type: 'string' } }, additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: (value as { greeting: string }).greeting }],
    },
    execute: async ({ name }: { name: string }) => ({ greeting: (source().prefix ?? 'Hello') + ', ' + name + '!' }),
  }))
}
