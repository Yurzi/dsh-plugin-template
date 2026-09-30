import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { runInNewContext } from 'node:vm'
import semver from 'semver'

function runPack() {
  try {
    const raw = execFileSync('pnpm', ['pack', '--json'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const pack = JSON.parse(raw)
    return pack.filename ?? pack[0]?.filename
  } catch {
    const cacheDir = join(tmpdir(), 'npm-cache')
    const raw = execFileSync('npm', ['pack', '--json', `--cache=${cacheDir}`], { encoding: 'utf8' })
    const pack = JSON.parse(raw)
    return pack.filename ?? pack[0]?.filename ?? Object.values(pack)[0]?.filename
  }
}

const baseline = '0.2.0-rc.2'
const supportRange = '>=0.2.0-rc.2 <0.3.0-0'
const root = fileURLToPath(new URL('..', import.meta.url))
const sourcePkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const dshPeers = Object.keys(sourcePkg.peerDependencies).filter(name => name.startsWith('@deepseek-ai/dsh-'))
const tarball = runPack()
assert.ok(tarball, 'package pack did not report a tarball')
const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-verify-'))
try {
  execFileSync('tar', ['-xzf', tarball, '-C', dir])
  const pkg = JSON.parse(readFileSync(join(dir, 'package/package.json'), 'utf8'))
  for (const path of ['lib/index.js', 'lib/contract.js', 'lib/client.js', 'lib/client.js.map', 'lib/types/index.d.ts', 'lib/types/contract.d.ts', 'lib/types/client/index.d.ts', 'cordis.patch.yml', 'docs/harness-contract.md', 'docs/upgrade-0.2.0-rc.2.md']) {
    assert.ok(readFileSync(join(dir, 'package', path)).length > 0, 'missing packed artifact: ' + path)
  }
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.engines?.dsh, supportRange)
  const range = pkg.engines.dsh
  assert.equal(pkg.peerDependencies?.['@deepseek-ai/dsh-tools'], range, 'missing required host runtime peer')
  // Match app-boot's peer gate, including its prerelease semantics.
  for (const dependency of dshPeers) {
    assert.equal(pkg.peerDependencies[dependency], range, 'inconsistent DSH peer: ' + dependency)
    assert.equal(sourcePkg.devDependencies[dependency], baseline, 'unpinned DSH development dependency: ' + dependency)
    for (const version of [baseline, '0.2.0-rc.3', '0.2.0', '0.2.1']) {
      assert.ok(semver.satisfies(version, range, { includePrerelease: true }), dependency + ' must accept ' + version)
    }
    for (const version of ['0.1.7-rc.1', '0.2.0-alpha.1', '0.2.0-rc.1', '0.3.0-alpha.1', '0.3.0-rc.1', '0.3.0', '1.0.0']) {
      assert.ok(!semver.satisfies(version, range, { includePrerelease: true }), dependency + ' must reject ' + version)
    }
    assert.ok(semver.satisfies(baseline, range), 'npm must accept the explicit prerelease baseline')
  }
  assert.deepEqual(pkg.dsh.client.inject, ['@deepseek-ai/dsh-client-locale', '@deepseek-ai/dsh-client-ui-plugin-manager'])
  for (const dependency of ['@deepseek-ai/dsh-client-locale', '@deepseek-ai/dsh-client-ui-plugin-manager', '@deepseek-ai/dsh-client-ui-renderer', '@deepseek-ai/dsh-client-ui-slots']) {
    assert.equal(pkg.peerDependencies[dependency], range, 'missing public client type peer: ' + dependency)
    assert.equal(pkg.peerDependenciesMeta[dependency]?.optional, true)
  }
  const client = readFileSync(join(dir, 'package/lib/client.js'), 'utf8')
  assert.ok(client.includes('window.__ModuleLoader__.load'), 'missing client loader wrapper')
  assert.ok(client.includes('plugins.bundle.config'), 'missing third-party configuration slot')
  assert.ok(!client.includes('settings.plugin.item'), 'obsolete settings slot in bundle')
  const host = readFileSync(join(dir, 'package/lib/index.js'), 'utf8')
  assert.ok(!host.includes('installSection'), 'obsolete settings API in host bundle')
  const sourceMap = JSON.parse(readFileSync(join(dir, 'package/lib/client.js.map'), 'utf8'))
  assert.ok(sourceMap.sourcesContent.some(source => source?.includes('plugins.bundle.config')), 'client sourcemap must embed source')

  // Resolve host-owned peers without installing into a user profile.
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'), 'dir')
  const { apply, Config, inject } = await import(pathToFileURL(join(dir, 'package/lib/index.js')).href)
  assert.deepEqual(inject, ['tools'])
  let tool
  apply({ tools: { register(value) { tool = value } } }, Config({ prefix: 'Packed' }))
  const result = await tool.execute({ name: 'DSH' }, {})
  assert.deepEqual(result, { greeting: 'Packed, DSH!' })
  assert.deepEqual(tool.output.render({ name: 'DSH' }, result), [{ type: 'text', text: 'Packed, DSH!' }])
  await assert.rejects(() => tool.execute({ name: 42 }, {}))

  let entry
  const styles = []
  runInNewContext(client, {
    window: { __ModuleLoader__: { load(value) { entry = value } } },
    document: {
      querySelector() { return null },
      createElement() { return { dataset: {} } },
      head: { appendChild(value) { styles.push(value) } },
    },
  })
  assert.equal(entry.id, pkg.name)
  const require = createRequire(import.meta.url)
  const clientPlugin = entry.factory(dependency => {
    assert.ok(['react', 'react/jsx-runtime'].includes(dependency), 'unexpected browser runtime dependency: ' + dependency)
    return require(dependency)
  })
  assert.deepEqual(Array.from(clientPlugin.inject), ['slots', 'locale'])
  let slot
  clientPlugin.apply({
    effect(fn) { return fn() },
    locale: { register(namespace) { assert.equal(namespace, pkg.name); return () => {} } },
    slots: {
      inject(name, fn) { assert.equal(name, 'plugins.bundle.config'); return fn() },
      register(options, component) { slot = { options, component }; return () => {} },
    },
  })
  assert.equal(slot.options.key, pkg.name)
  assert.equal(slot.options.locale, pkg.name)
  assert.equal(slot.component({ t: key => key, view: 'page' }).type, 'section')
  assert.equal(styles.length, 1, 'CSS Modules must load through the browser factory')
  assert.equal(styles[0].dataset.plugin, pkg.name)
  console.log('packed plugin contract, version gate, host/client runtime and CSS verified:', tarball)
} finally {
  rmSync(dir, { recursive: true, force: true })
  rmSync(tarball, { force: true })
}
