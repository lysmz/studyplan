// Read-only evidence for the local Windows package; no binary/fuse mutation.
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { createHash } = require('node:crypto')
const { resolve, join } = require('node:path')
const { getRawHeader, extractFile } = require('@electron/asar')
const { NtExecutable, NtExecutableResource } = require('resedit')
const { getCurrentFuseWire, FuseV1Options } = require('@electron/fuses')

async function main() {
  const directory = resolve(process.argv[2] || 'dist/win-unpacked')
  const executable = join(directory, 'studyplan.exe')
  const archive = join(directory, 'resources/app.asar')
  const binary = readFileSync(executable)
  const wire = await getCurrentFuseWire(executable)
  const names = Object.keys(FuseV1Options).filter((name) => !/^\d+$/.test(name))
  const fuses = Object.fromEntries(names.map((name) => [name, wire[FuseV1Options[name]]]))
  for (const name of [
    'RunAsNode',
    'EnableNodeOptionsEnvironmentVariable',
    'EnableNodeCliInspectArguments',
    'GrantFileProtocolExtraPrivileges'
  ]) {
    assert.equal(fuses[name], 48, `${name} must be disabled`)
  }
  for (const name of ['OnlyLoadAppFromAsar', 'EnableEmbeddedAsarIntegrityValidation']) {
    assert.equal(fuses[name], 49, `${name} must be enabled`)
  }
  const resources = NtExecutableResource.from(NtExecutable.from(binary)).entries
  const entry = resources.find((item) => item.type === 'INTEGRITY' && item.id === 'ELECTRONASAR')
  assert.ok(entry, 'EXE must contain ELECTRONASAR integrity metadata')
  const integrity = JSON.parse(Buffer.from(entry.bin).toString('utf8'))
  const headerHash = createHash('sha256').update(getRawHeader(archive).headerString).digest('hex')
  const appIntegrity = integrity.find((item) => item.file.toLowerCase() === 'resources\\app.asar')
  assert.ok(appIntegrity, 'app.asar must have embedded integrity data')
  assert.equal(appIntegrity.alg.toLowerCase(), 'sha256')
  assert.equal(appIntegrity.value, headerHash, 'embedded hash must match the actual ASAR header')
  const manifest = JSON.parse(extractFile(archive, 'package.json').toString('utf8'))
  // Verify actual bytes as well: a matching header does not establish a valid payload.
  const mainPath = manifest.main.replace(/^\.\//, '').replaceAll('/', require('node:path').sep)
  const main = extractFile(archive, mainPath)
  const { statFile, listPackage } = require('@electron/asar')
  assert.equal(
    createHash('sha256').update(main).digest('hex'),
    statFile(archive, mainPath).integrity.hash
  )
  assert.ok(
    !listPackage(archive).some((path) => /^[/\\](docs|scripts|spike|supabase)[/\\]/.test(path))
  )
  console.log(
    JSON.stringify(
      {
        executable,
        archive,
        appVersion: manifest.version,
        executableSha256: createHash('sha256').update(binary).digest('hex'),
        asarSha256: createHash('sha256').update(readFileSync(archive)).digest('hex'),
        fuses,
        integrity,
        actualHeaderSha256: headerHash,
        integrityMatches: true
      },
      null,
      2
    )
  )
}
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
