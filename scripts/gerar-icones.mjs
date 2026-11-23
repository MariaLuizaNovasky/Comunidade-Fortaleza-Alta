// Gera os PNGs do PWA a partir do SVG usando o Chromium ja instalado.
// Requer o Playwright: npm i -D playwright && npx playwright install chromium
const pw = await import('playwright').catch(() => {
  console.error('Instale o Playwright para gerar os ícones: npm i -D playwright && npx playwright install chromium')
  process.exit(1)
})
const { chromium } = pw.default ?? pw
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..')
const svg = readFileSync(join(raiz, 'public/favicon.svg'), 'utf8')

const saidas = [
  { arquivo: 'icone-192.png', tamanho: 192, margem: 0 },
  { arquivo: 'icone-512.png', tamanho: 512, margem: 0 },
  { arquivo: 'apple-touch-icon.png', tamanho: 180, margem: 0 },
  // maskable: o icone precisa caber na "zona segura" (80% do quadro)
  { arquivo: 'icone-maskable-512.png', tamanho: 512, margem: 54 },
]

const navegador = await chromium.launch()
for (const { arquivo, tamanho, margem } of saidas) {
  const pagina = await navegador.newPage({
    viewport: { width: tamanho, height: tamanho },
    deviceScaleFactor: 1,
  })
  const interno = tamanho - margem * 2
  await pagina.setContent(`<!doctype html><html><body style="margin:0;background:#0a3328;
      width:${tamanho}px;height:${tamanho}px;display:flex;align-items:center;justify-content:center">
      <div style="width:${interno}px;height:${interno}px">${svg}</div></body></html>`)
  const imagem = await pagina.screenshot({ omitBackground: false })
  writeFileSync(join(raiz, 'public', arquivo), imagem)
  await pagina.close()
  console.log(`gerado public/${arquivo} (${tamanho}x${tamanho})`)
}
await navegador.close()
