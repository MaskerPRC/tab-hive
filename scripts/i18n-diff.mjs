/**
 * i18n-diff.mjs
 *
 * Compare zh.js (as the source of truth) against all other locale files.
 * Output:
 *   1. Console summary of missing keys per locale
 *   2. A JSON file (i18n-missing.json) with the missing keys and their zh values,
 *      grouped by locale, ready to be sent to an LLM for translation.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { join, basename } from 'path'
import { pathToFileURL } from 'url'

const LOCALES_DIR = join(import.meta.dirname, '..', 'src', 'i18n', 'locales')
const OUTPUT_FILE = join(import.meta.dirname, 'i18n-missing.json')

// Flatten nested object to dot-notation keys
function flattenKeys(obj, prefix = '') {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenKeys(value, fullKey))
    } else {
      result[fullKey] = value
    }
  }
  return result
}

// Dynamic import of a locale .js file (ESM default export)
async function loadLocale(filePath) {
  const url = pathToFileURL(filePath).href
  const mod = await import(url)
  return mod.default
}

async function main() {
  // Load zh.js as source of truth
  const zhPath = join(LOCALES_DIR, 'zh.js')
  const zhObj = await loadLocale(zhPath)
  const zhFlat = flattenKeys(zhObj)
  const zhKeys = Object.keys(zhFlat).sort()

  console.log(`[zh.js] Total keys: ${zhKeys.length}\n`)

  // Discover all other locale files
  const files = readdirSync(LOCALES_DIR).filter(f => f.endsWith('.js') && f !== 'zh.js')
  files.sort()

  const missing = {} // { locale: { dotKey: zhValue } }

  for (const file of files) {
    const locale = basename(file, '.js')
    const localePath = join(LOCALES_DIR, file)
    const localeObj = await loadLocale(localePath)
    const localeFlat = flattenKeys(localeObj)
    const localeKeys = new Set(Object.keys(localeFlat))

    const missingKeys = zhKeys.filter(k => !localeKeys.has(k))

    if (missingKeys.length > 0) {
      missing[locale] = {}
      for (const k of missingKeys) {
        missing[locale][k] = zhFlat[k]
      }
    }

    // Also check for extra keys in locale that don't exist in zh
    const extraKeys = [...localeKeys].filter(k => !(k in zhFlat))

    console.log(`[${locale}.js] keys: ${localeKeys.size} | missing: ${missingKeys.length} | extra: ${extraKeys.length}`)
    if (missingKeys.length > 0) {
      console.log(`  Missing: ${missingKeys.slice(0, 10).join(', ')}${missingKeys.length > 10 ? ` ... and ${missingKeys.length - 10} more` : ''}`)
    }
    if (extraKeys.length > 0) {
      console.log(`  Extra:   ${extraKeys.slice(0, 5).join(', ')}${extraKeys.length > 5 ? ` ... and ${extraKeys.length - 5} more` : ''}`)
    }
  }

  // Write output
  writeFileSync(OUTPUT_FILE, JSON.stringify(missing, null, 2), 'utf-8')
  console.log(`\nMissing keys written to: ${OUTPUT_FILE}`)
  console.log(`Total locales with missing keys: ${Object.keys(missing).length}`)
  for (const [locale, keys] of Object.entries(missing)) {
    console.log(`  ${locale}: ${Object.keys(keys).length} missing`)
  }
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
