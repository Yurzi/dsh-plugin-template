/** Host half of the plugin. Keep named Cordis exports; do not default-export apply. */
import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'

export const name = 'dsh-plugin-template'
export const inject = ['tools']

export const Config = z.object({ prefix: z.string().default('Hello').volatile() })
export type Config = ReturnType<typeof Config>

export function apply(ctx: Context, config: Config): void {
  // Cordis owns the live config. Read volatile values at execution time.
  ctx.tools.register(defineTool({
    name: 'template_greet',
    description: 'Return a greeting using this plugin configuration.',
    parameters: { name: { type: 'string', required: true, description: 'Name to greet.' } },
    output: {
      schema: { type: 'object', properties: { greeting: { type: 'string' } }, additionalProperties: false },
      render: (_args, value) => [{ type: 'text', text: (value as { greeting: string }).greeting }],
    },
    execute: async ({ name }: { name: string }) => ({ greeting: config.prefix.get() + ', ' + name + '!' }),
  }))
}
