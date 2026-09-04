/** Verify that the project-local bilingual prompt template renders in both directions. */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { agentCorpusRoot } from './repo-files.ts'
import {
  documentedTranslationPromptPlaceholders,
  renderTranslationPrompt,
  TRANSLATION_PROMPT_PLACEHOLDERS,
} from './translation-prompt.ts'

const root = agentCorpusRoot()

function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

try {
  const document = read('docs/i18n/translation-prompt.md')
  const terminology = read('docs/i18n/terminology.md')
  const documented = documentedTranslationPromptPlaceholders(document)
  if (documented.join('\n') !== TRANSLATION_PROMPT_PLACEHOLDERS.join('\n')) {
    throw new Error(`placeholder table must list exactly: ${TRANSLATION_PROMPT_PLACEHOLDERS.join(', ')}`)
  }
  const english = renderTranslationPrompt(document, {
    sourceLanguage: 'English', sourceFilename: 'document.md', terminology,
  })
  const chinese = renderTranslationPrompt(document, {
    sourceLanguage: 'Chinese', sourceFilename: 'document.zh.md', terminology,
  })
  if (english.includes('{{') || chinese.includes('{{')) throw new Error('rendered prompt contains an unresolved placeholder')
  if (!english.includes('from English to Chinese')) throw new Error('English-source render does not translate into Chinese')
  if (!chinese.includes('from Chinese to English')) throw new Error('Chinese-source render does not translate into English')
  console.log('verify-translation-prompt: both directions render with the documented placeholders.')
} catch (error) {
  console.error(`verify-translation-prompt: ${error instanceof Error ? error.message : String(error)}`)
  process.exit(1)
}
