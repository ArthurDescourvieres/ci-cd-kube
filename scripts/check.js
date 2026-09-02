import { readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const DIRECTORIES = ['src', 'tests', 'scripts']

function jsFiles(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return jsFiles(path)
    return /\.m?js$/.test(name) ? [path] : []
  })
}

const files = DIRECTORIES.flatMap(jsFiles)
let errors = 0

for (const f of files) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
    console.log(`  ok   ${f}`)
  } catch (e) {
    errors++
    console.error(`  FAIL ${f}`)
    console.error(String(e.stderr).trim())
  }
}

console.log(`\n${files.length} file(s) checked, ${errors} error(s)`)
process.exit(errors > 0 ? 1 : 0)
