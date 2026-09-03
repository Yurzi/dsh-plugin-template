/** Browser half discovered through package.json dsh.client and exports["./client"]. */
import type { Context } from '@deepseek-ai/cordis'
import React from 'react'
import css from './index.module.css'

const NS = 'dsh-plugin-template'
const dictionaries = {
  en: { title: 'Template plugin', description: 'Example third-party DSH plugin surface.' },
  zh: { title: '模板插件', description: '第三方 DSH 插件界面示例。' },
}

type ClientContext = Context & {
  locale: { register(ns: string, dictionaries: Record<string, Record<string, string>>): () => void; bind(ns: string): (key: 'title' | 'description') => string }
  slots: { inject(name: string, factory: () => unknown): void; register(options: Record<string, unknown>, component: unknown): () => void }
}

function SettingsPanel({ t }: { readonly t: (key: 'title' | 'description') => string }): React.JSX.Element {
  return (
    <li className={css.card}>
      <div className={css.header}>
        <h3 className={css.title}>{t('title')}</h3>
        <p className={css.description}>{t('description')}</p>
      </div>
    </li>
  )
}

export const inject = ['slots', 'locale']

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, dictionaries), NS + ': dictionaries')
  const t = ctx.locale.bind(NS)
  ctx.slots.inject('settings.plugin.item', () => ctx.slots.register({ name: 'settings.plugin.item', key: NS, locale: NS, inject: () => ({ t }) }, SettingsPanel))
}
