/** Browser half discovered through package.json dsh.client and exports["./client"]. */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-plugin-manager/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import React from 'react'
import css from './index.module.css'

const NS = 'dsh-plugin-template'
const dictionaries = {
  en: { title: 'Template plugin', description: 'Edit the greeting prefix in the plugin row configuration below.' },
  zh: { title: '模板插件', description: '请在下方插件条目的配置中编辑问候语前缀。' },
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    'dsh-plugin-template': keyof typeof dictionaries.en
  }
}

type SettingsPanelProps = PropsRuntime<'plugins.bundle.config'> & PropsLocale<typeof NS>

function SettingsPanel({ t, view }: SettingsPanelProps): React.JSX.Element {
  if (view === 'summary') return <>{t('description')}</>
  return (
    <section className={css.card}>
      <div className={css.header}>
        <h3 className={css.title}>{t('title')}</h3>
        <p className={css.description}>{t('description')}</p>
      </div>
    </section>
  )
}

export const inject = ['slots', 'locale']

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.locale.register(NS, dictionaries), NS + ': dictionaries')
  // Third-party bundles own a keyed configuration surface, not plugins.item.
  // Leave row configuration to the Host's generated volatile-field editor.
  ctx.slots.inject('plugins.bundle.config', () => ctx.slots.register({
    name: 'plugins.bundle.config', key: NS, locale: NS,
  }, SettingsPanel))
}
