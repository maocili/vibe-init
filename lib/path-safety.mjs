import { lstat, realpath } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'

function isContained(root, target) {
  const rel = relative(root, target)
  return rel === '' || rel !== '..' && !rel.startsWith('..' + sep) && !rel.startsWith(sep)
}

/**
 * Verify that a lexical descendant stays under root through every existing filesystem entry.
 * Missing suffixes are allowed; existing symlinks are resolved and must remain under the real root.
 */
export async function assertRealPathContained(root, target, label = target) {
  const rootAbs = resolve(root)
  const targetAbs = resolve(target)
  if (!isContained(rootAbs, targetAbs)) {
    throw new Error('path escapes lexical root for ' + label + ': ' + JSON.stringify(targetAbs))
  }

  let rootReal
  try {
    await lstat(rootAbs)
    rootReal = await realpath(rootAbs)
  } catch (error) {
    throw new Error('cannot resolve containment root for ' + label + ': ' + (error instanceof Error ? error.message : String(error)))
  }

  const rel = relative(rootAbs, targetAbs)
  let current = rootAbs
  for (const part of rel === '' ? [] : rel.split(sep)) {
    current = resolve(current, part)
    try {
      await lstat(current)
    } catch (error) {
      if (error && error.code === 'ENOENT') return targetAbs
      throw new Error('cannot inspect path for ' + label + ': ' + (error instanceof Error ? error.message : String(error)))
    }
    let currentReal
    try {
      currentReal = await realpath(current)
    } catch (error) {
      throw new Error('cannot resolve path for ' + label + ': ' + (error instanceof Error ? error.message : String(error)))
    }
    if (!isContained(rootReal, currentReal)) {
      throw new Error('path escapes real root for ' + label + ': ' + JSON.stringify(current))
    }
  }
  return targetAbs
}
