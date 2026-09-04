// Tiny line diff (DP/LCS) used to preview what an apply would change — enough for a
// consent-before-write review without external dependencies.
export function diffLines(aText, bText) {
  const a = (aText || '').split('\n')
  const b = (bText || '').split('\n')
  const n = a.length, m = b.length
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const out = []
  let i = 0, j = 0
  while (i < n && j < m) {
    if (a[i] === b[j]) { out.push(' ' + a[i]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push('-' + a[i]); i++ }
    else { out.push('+' + b[j]); j++ }
  }
  while (i < n) out.push('-' + a[i++])
  while (j < m) out.push('+' + b[j++])
  return out
}

/** Render a bounded unified-ish preview of a single-file change. */
export function preview(title, oldText, newText, max = 80) {
  const lines = diffLines(oldText, newText)
  const adds = lines.filter((l) => l.startsWith('+')).length
  const dels = lines.filter((l) => l.startsWith('-')).length
  const head = lines.length > max ? [...lines.slice(0, max), '  … (' + (lines.length - max) + ' more diff lines)'] : lines
  return { title, adds, dels, text: head.join('\n') }
}
