#!/usr/bin/env node
// dsh-rules CLI entry (M1). Thin wrapper over lib/cli.mjs — also importable by future tools.
import { main } from '../lib/cli.mjs'
process.exitCode = await main(process.argv.slice(2))
