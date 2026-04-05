/**
 * i18n-apply.mjs
 *
 * Reads an incremental translation JSON file and merges the translations
 * into each locale's .js file.
 *
 * Input format (i18n-incremental.json):
 * {
 *   "en": { "apiSettings.title": "API Service Settings", ... },
 *   "ja": { "apiSettings.title": "APIサービス設定", ... },
 *   ...
 * }
 *
 * Usage:
 *   node scripts/i18n-apply.mjs [path-to-incremental.json]
 *   (defaults to scripts/i18n-incremental.json)
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { pathToFileURL } from 'url'

const LOCALES_DIR = join(import.meta.dirname, '..', 'src', 'i18n', 'locales')
const DEFAULT_INPUT = join(import.meta.dirname, 'i18n-incremental.json')

// Expand dot-notation keys into nested object
function expandKeys(flat) {
  const result = {}
  for (const [dotKey, value] of Object.entries(flat)) {
    const parts = dotKey.split('.')
    let cur = result
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in cur)) cur[parts[i]] = {}
      cur = cur[parts[i]]
    }
    cur[parts[parts.length - 1]] = value
  }
  return result
}

// Deep merge source into target (target is mutated)
function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (!(key in target) || typeof target[key] !== 'object') {
        target[key] = {}
      }
      deepMerge(target[key], value)
    } else {
      target[key] = value
    }
  }
  return target
}

// Load a locale .js file
async function loadLocale(filePath) {
  const url = pathToFileURL(filePath).href
  const mod = await import(url)
  return mod.default
}

// Serialize locale object back to .js file content
// Preserves the `export default { ... }` format with proper indentation
function serializeLocale(obj, indent = 2) {
  function serialize(val, depth) {
    const pad = ' '.repeat(depth * indent)
    const padInner = ' '.repeat((depth + 1) * indent)

    if (val === null || val === undefined) return 'null'
    if (typeof val === 'boolean') return String(val)
    if (typeof val === 'number') return String(val)
    if (typeof val === 'string') {
      // Use single quotes, escape internal single quotes
      const escaped = val.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')
      return `'${escaped}'`
    }
    if (Array.isArray(val)) {
      const items = val.map(v => serialize(v, depth + 1))
      return `[${items.join(', ')}]`
    }

    // Object
    const entries = Object.entries(val)
    if (entries.length === 0) return '{}'

    const lines = entries.map(([k, v]) => {
      // Key quoting: use bare key if valid identifier, else quote
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : `'${k}'`
      return `${padInner}${safeKey}: ${serialize(v, depth + 1)}`
    })

    return `{\n${lines.join(',\n')}\n${pad}}`
  }

  return `export default ${serialize(obj, 0)}\n`
}

async function main() {
  const inputFile = process.argv[2] || DEFAULT_INPUT
  console.log(`Reading incremental translations from: ${inputFile}`)

  const incremental = JSON.parse(readFileSync(inputFile, 'utf-8'))
  const locales = Object.keys(incremental).sort()
  console.log(`Found translations for ${locales.length} locales: ${locales.join(', ')}\n`)

  for (const locale of locales) {
    const filePath = join(LOCALES_DIR, `${locale}.js`)
    const flat = incremental[locale]
    const keyCount = Object.keys(flat).length

    // Load existing locale
    let existing
    try {
      existing = await loadLocale(filePath)
    } catch (err) {
      console.log(`[${locale}] SKIP - file not found or cannot load: ${err.message}`)
      continue
    }

    // Expand flat keys to nested
    const nested = expandKeys(flat)

    // Deep merge
    deepMerge(existing, nested)

    // Re-serialize and write
    const content = serializeLocale(existing)
    writeFileSync(filePath, content, 'utf-8')
    console.log(`[${locale}] Applied ${keyCount} keys`)
  }

  console.log('\nDone!')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
