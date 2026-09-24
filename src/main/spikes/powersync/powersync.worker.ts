import { existsSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, sep } from 'node:path'
import { getPowerSyncExtensionFilename, startPowerSyncWorker } from '@powersync/node/worker.js'

const require = createRequire(import.meta.url)

function resolvePowerSyncExtension(): string {
  const extensionFilename = getPowerSyncExtensionFilename()
  const unpackedExtensionPath = join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    '@powersync',
    'node',
    'lib',
    extensionFilename
  )

  if (existsSync(unpackedExtensionPath)) {
    return unpackedExtensionPath
  }

  const packageJsonPath = require.resolve('@powersync/node/package.json')
  const packagedSegment = `${sep}app.asar${sep}`
  const unpackedSegment = `${sep}app.asar.unpacked${sep}`
  const loadablePackageJsonPath = packageJsonPath.replace(packagedSegment, unpackedSegment)

  return join(dirname(loadablePackageJsonPath), 'lib', extensionFilename)
}

startPowerSyncWorker({
  extensionPath: resolvePowerSyncExtension
})
