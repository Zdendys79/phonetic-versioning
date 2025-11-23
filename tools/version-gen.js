#!/usr/bin/env node
/**
 * CLI tool for phonetic version generation
 * Usage: version-gen [options] [timestamp]
 */

import { generateVersion, parseVersion, isValidVersion, getStats } from '../src/generator.js';

const args = process.argv.slice(2);

// Help text
const helpText = `
Phonetic Version Generator - CLI Tool

USAGE:
  version-gen [options] [timestamp]

OPTIONS:
  -h, --help          Show this help message
  -s, --stats         Show syllable statistics
  -p, --parse <ver>   Parse version string to timestamp
  -v, --validate <ver> Validate version string format
  -H, --hyphenated    Generate with hyphens between syllables
  -i, --interval <n>  Build interval in seconds (default: 180)
  -m, --min <n>       Minimum number of syllables

ARGUMENTS:
  timestamp           Unix timestamp (seconds). If omitted, uses current time.

EXAMPLES:
  version-gen                      # Generate version for current time
  version-gen 1732127000           # Generate for specific timestamp
  version-gen --hyphenated         # Generate with hyphens: brak-to-fen
  version-gen --parse braktofin    # Parse version to timestamp
  version-gen --stats              # Show syllable statistics
  version-gen --validate braktofin # Check if version is valid

`;

// Parse arguments
let mode = 'generate';
let timestamp = null;
let options = {
  buildInterval: 180,
  hyphenated: false,
  minSyllables: 0
};
let targetVersion = null;

for (let i = 0; i < args.length; i++) {
  const arg = args[i];

  switch (arg) {
    case '-h':
    case '--help':
      console.log(helpText);
      process.exit(0);

    case '-s':
    case '--stats':
      mode = 'stats';
      break;

    case '-p':
    case '--parse':
      mode = 'parse';
      targetVersion = args[++i];
      break;

    case '-v':
    case '--validate':
      mode = 'validate';
      targetVersion = args[++i];
      break;

    case '-H':
    case '--hyphenated':
      options.hyphenated = true;
      break;

    case '-i':
    case '--interval':
      options.buildInterval = parseInt(args[++i], 10);
      break;

    case '-m':
    case '--min':
      options.minSyllables = parseInt(args[++i], 10);
      break;

    default:
      if (!arg.startsWith('-')) {
        timestamp = parseInt(arg, 10);
      }
  }
}

// Execute command
try {
  switch (mode) {
    case 'stats': {
      const stats = getStats();
      console.log('\n=== Syllable Statistics ===\n');
      console.log(`Total syllables: ${stats.totalSyllables}`);
      console.log(`Bits per syllable: ${stats.bitsPerSyllable.toFixed(2)}`);
      console.log('\nDistribution:');
      for (const [type, count] of Object.entries(stats.distribution)) {
        console.log(`  ${type}: ${count}`);
      }
      console.log('\nPhonotactics:');
      console.log(`  Valid onsets: ${stats.phonotactics.valid_onsets.length}`);
      console.log(`  Valid codas: ${stats.phonotactics.valid_codas.length}`);
      console.log(`  Vowels: ${stats.phonotactics.vowels.length}`);
      console.log('');
      break;
    }

    case 'parse': {
      if (!targetVersion) {
        console.error('[ERROR] No version string provided');
        process.exit(1);
      }

      const parsed = parseVersion(targetVersion, options.buildInterval);
      console.log('\n=== Parse Result ===\n');
      console.log(`Version: ${targetVersion}`);
      console.log(`Timestamp: ${parsed.timestamp}`);
      console.log(`Date: ${parsed.date}`);
      console.log(`Normalized: ${parsed.normalized}`);
      console.log('');
      break;
    }

    case 'validate': {
      if (!targetVersion) {
        console.error('[ERROR] No version string provided');
        process.exit(1);
      }

      const valid = isValidVersion(targetVersion);
      if (valid) {
        console.log(`[OK] "${targetVersion}" is a valid version`);
        const parsed = parseVersion(targetVersion, options.buildInterval);
        console.log(`     Decodes to: ${parsed.timestamp} (${parsed.date})`);
      } else {
        console.log(`[ERROR] "${targetVersion}" is NOT a valid version`);
        process.exit(1);
      }
      break;
    }

    case 'generate':
    default: {
      const version = generateVersion(timestamp, options);
      console.log(version);

      // If not piped, show extra info
      if (process.stdout.isTTY) {
        const parsed = parseVersion(version, options.buildInterval);
        console.log(`\n[INFO] Timestamp: ${parsed.timestamp}`);
        console.log(`[INFO] Date: ${parsed.date}`);
        console.log(`[INFO] Length: ${version.length} chars`);
      }
      break;
    }
  }
} catch (error) {
  console.error(`[ERROR] ${error.message}`);
  process.exit(1);
}
