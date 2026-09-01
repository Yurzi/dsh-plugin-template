declare module '@deepseek-ai/cordis' {
  interface Context {
    settings?: {
      installSection<T>(
        owner: Context,
        ns: string,
        schema: unknown,
        entry: T,
        hooks: { setSource: (source: () => T) => void; onChange: () => void; validate?: (value: T) => void },
      ): void
    }
  }
}

declare global {
  interface Window {
    __ModuleLoader__: { load(entry: { id: string; factory: (require: (id: string) => unknown) => unknown }): void }
  }
}

export {}
