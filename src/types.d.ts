declare global {
  interface Window {
    __ModuleLoader__: { load(entry: { id: string; factory: (require: (id: string) => unknown) => unknown }): void }
  }
}

export {}
