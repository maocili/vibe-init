#!/usr/bin/env node
// Standalone vibe-init CLI entry. Thin wrapper over lib/cli.mjs.
import { main } from '../lib/cli.mjs'
process.exitCode = await main(process.argv.slice(2))
