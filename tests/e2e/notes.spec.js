import { test, expect } from '@playwright/test'

test('créer une note, la retrouver après rechargement, la supprimer', async ({ page }, testInfo) => {
  const title = `Note ${testInfo.project.name} ${Date.now()}`

  await page.goto('/')

  await page.getByLabel('Titre').fill(title)
  await page.getByLabel('Contenu').fill('écrite par Playwright')
  await page.getByRole('button', { name: 'Ajouter' }).click()

  const note = page.getByTestId('note').filter({ hasText: title })
  await expect(note).toBeVisible()

  await page.reload()
  await expect(note).toBeVisible()

  await note.getByRole('button', { name: 'Supprimer' }).click()
  await expect(note).toHaveCount(0)
})