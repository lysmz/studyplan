import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, relative } from 'node:path'
import { buildGeneratedFiles } from './generator-lib'

async function main(): Promise<void> {
  const check = process.argv.includes('--check')
  const files = await buildGeneratedFiles()
  const stale: string[] = []

  for (const file of files) {
    if (check) {
      const existing = await readFile(file.path, 'utf8').catch(() => undefined)
      if (existing !== file.content) stale.push(relative(process.cwd(), file.path))
    } else {
      await mkdir(dirname(file.path), { recursive: true })
      await writeFile(file.path, file.content, 'utf8')
      console.log(`generated ${relative(process.cwd(), file.path)}`)
    }
  }

  if (stale.length > 0) {
    console.error(
      `Generated API files are stale or missing:\n${stale.map((path) => `- ${path}`).join('\n')}`
    )
    console.error('Run `npm run api:generate` and commit the result.')
    process.exitCode = 1
  } else if (check) {
    console.log('Generated API files are current.')
  }
}

void main()
