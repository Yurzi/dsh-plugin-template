import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
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

const tarball = runPack()
assert.ok(tarball, 'package pack did not report a tarball')
const dir = mkdtempSync(join(tmpdir(), 'dsh-plugin-verify-'))
try {
  execFileSync('tar', ['-xzf', tarball, '-C', dir])
  const pkg = JSON.parse(readFileSync(join(dir, 'package/package.json'), 'utf8'))
  for (const path of ['lib/index.js', 'lib/client.js', 'lib/types/index.d.ts', 'cordis.patch.yml']) {
    assert.ok(readFileSync(join(dir, 'package', path)).length > 0, 'missing packed artifact: ' + path)
  }
  assert.equal(pkg.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(pkg.engines?.dsh, '>=0.1.7-rc.1 <0.1.8-0')
  assert.equal(pkg.peerDependencies?.['@deepseek-ai/dsh-tools'], pkg.engines.dsh)
  // Match app-boot's peer gate, including its prerelease semantics.
  const range = pkg.peerDependencies['@deepseek-ai/dsh-tools']
  for (const version of ['0.1.7-rc.1', '0.1.7']) {
    assert.ok(semver.satisfies(version, range, { includePrerelease: true }), 'must accept ' + version)
  }
  for (const version of ['0.1.5-rc.2', '0.1.7-alpha.2', '0.1.8-alpha.1']) {
    assert.ok(!semver.satisfies(version, range, { includePrerelease: true }), 'must reject ' + version)
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
  console.log('packed plugin contract verified:', tarball)
} finally {
  rmSync(dir, { recursive: true, force: true })
  rmSync(tarball, { force: true })
}
