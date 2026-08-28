export interface PluginStatus {
  readonly prefix: string
  readonly tools: readonly string[]
}

export const RPC_METHODS = { status: 'dsh-plugin-template/status' } as const
