import { readdirSync, statSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'

const DOSSIERS = ['src', 'tests', 'scripts']

function fichiersJs(dossier) {
  if (!existsSync(dossier)) return []
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    if (statSync(chemin).isDirectory()) return fichiersJs(chemin)
    return /\.m?js$/.test(nom) ? [chemin] : []
  })
}

const fichiers = DOSSIERS.flatMap(fichiersJs)
let erreurs = 0

for (const f of fichiers) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' })
    console.log(`  ok   ${f}`)
  } catch (e) {
    erreurs++
    console.error(`  FAIL ${f}`)
    console.error(String(e.stderr).trim())
  }
}

console.log(`\n${fichiers.length} fichier(s) vérifié(s), ${erreurs} erreur(s)`)
process.exit(erreurs > 0 ? 1 : 0)
