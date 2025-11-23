/**
 * Basic tests for phonetic versioning
 */

import { toBase128, fromBase128, encodeToSyllableIndices, decodeSyllableIndices } from '../src/encoder.js';
import { decodeVersion, parseVersionToSyllables } from '../src/decoder.js';
import { generateVersion, parseVersion, isValidVersion, getStats } from '../src/generator.js';

// Simple test runner
function test(name, fn) {
  try {
    fn();
    console.log(`[OK] ${name}`);
    return true;
  } catch (error) {
    console.log(`[ERROR] ${name}`);
    console.log(`  ${error.message}`);
    return false;
  }
}

function assertEquals(actual, expected, message = '') {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Got: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(condition, message = 'Assertion failed') {
  if (!condition) {
    throw new Error(message);
  }
}

// Run tests
console.log('\n=== Encoder Tests ===\n');

test('toBase128: converts 0 correctly', () => {
  assertEquals(toBase128(0), [0]);
});

test('toBase128: converts small numbers', () => {
  assertEquals(toBase128(5), [5]);
  assertEquals(toBase128(127), [127]);
});

test('toBase128: converts numbers > 128', () => {
  assertEquals(toBase128(128), [1, 0]);
  assertEquals(toBase128(129), [1, 1]);
  assertEquals(toBase128(256), [2, 0]);
});

test('toBase128: converts large numbers', () => {
  const result = toBase128(9622927);
  assertTrue(result.length > 0, 'Should produce array');
  assertTrue(result.every(n => n >= 0 && n < 128), 'All digits should be 0-127');
});

test('fromBase128: reverses toBase128', () => {
  for (const num of [0, 5, 127, 128, 256, 1000, 9622927]) {
    const encoded = toBase128(num);
    const decoded = fromBase128(encoded);
    assertEquals(decoded, num, `Failed for ${num}`);
  }
});

test('encodeToSyllableIndices: works with padding', () => {
  const indices = encodeToSyllableIndices(5, 3);
  assertEquals(indices.length, 3);
  assertEquals(indices[2], 5);
});

test('decodeSyllableIndices: reverses encoding', () => {
  const indices = [1, 2, 3];
  const num = decodeSyllableIndices(indices);
  const back = encodeToSyllableIndices(num);
  // Note: back may have different length due to no leading zeros
  assertEquals(decodeSyllableIndices(back), num);
});

console.log('\n=== Generator Tests ===\n');

test('generateVersion: produces string', () => {
  const version = generateVersion(1732127000);
  assertTrue(typeof version === 'string', 'Should return string');
  assertTrue(version.length > 0, 'Should not be empty');
});

test('generateVersion: is deterministic', () => {
  const v1 = generateVersion(1732127000);
  const v2 = generateVersion(1732127000);
  assertEquals(v1, v2, 'Same timestamp should produce same version');
});

test('generateVersion: different timestamps produce different versions', () => {
  const v1 = generateVersion(1732127000);
  const v2 = generateVersion(1732127180);
  assertTrue(v1 !== v2, 'Different timestamps should produce different versions');
});

test('generateVersion: with hyphens', () => {
  const version = generateVersion(1732127000, { hyphenated: true });
  assertTrue(version.includes('-'), 'Should contain hyphens');
});

test('parseVersion: decodes back to timestamp', () => {
  const timestamp = 1732127000;
  const version = generateVersion(timestamp);
  const parsed = parseVersion(version);

  // Should be within build interval
  const diff = Math.abs(parsed.timestamp - timestamp);
  assertTrue(diff < 180, `Timestamp difference ${diff} should be < 180s`);
});

test('parseVersion: roundtrip test', () => {
  const timestamps = [1000000, 1732127000, 1732127180, 1732127360];

  for (const ts of timestamps) {
    const version = generateVersion(ts);
    const parsed = parseVersion(version);
    const normalized = Math.floor(ts / 180);
    const parsedNormalized = Math.floor(parsed.timestamp / 180);

    assertEquals(parsedNormalized, normalized, `Roundtrip failed for ${ts}`);
  }
});

test('isValidVersion: validates correct versions', () => {
  const version = generateVersion(1732127000);
  assertTrue(isValidVersion(version), 'Should validate generated version');
});

test('isValidVersion: rejects invalid versions', () => {
  assertTrue(!isValidVersion('xyz123'), 'Should reject invalid syllables');
  assertTrue(!isValidVersion(''), 'Should reject empty string');
});

console.log('\n=== Decoder Tests ===\n');

test('parseVersionToSyllables: handles plain format', () => {
  const syllables = parseVersionToSyllables('babebi');
  assertEquals(syllables, ['ba', 'be', 'bi']);
});

test('parseVersionToSyllables: handles hyphenated format', () => {
  const syllables = parseVersionToSyllables('ba-be-bi');
  assertEquals(syllables, ['ba', 'be', 'bi']);
});

test('decodeVersion: decodes syllable string', () => {
  const num = decodeVersion('ba');
  assertTrue(num >= 0 && num < 128, 'Single syllable should decode to 0-127');
});

console.log('\n=== Stats Tests ===\n');

test('getStats: returns statistics', () => {
  const stats = getStats();
  assertEquals(stats.totalSyllables, 128, 'Should have 128 syllables');
  assertTrue(stats.bitsPerSyllable > 0, 'Should calculate bits per syllable');
});

console.log('\n=== Integration Tests ===\n');

test('Full roundtrip: timestamp -> version -> timestamp', () => {
  const originalTimestamp = 1732127000;
  const version = generateVersion(originalTimestamp);
  const parsed = parseVersion(version);

  // Normalized values should match exactly
  const originalNormalized = Math.floor(originalTimestamp / 180);
  const parsedNormalized = Math.floor(parsed.timestamp / 180);

  assertEquals(parsedNormalized, originalNormalized,
    `Full roundtrip failed:\n  Original: ${originalTimestamp}\n  Version: ${version}\n  Parsed: ${parsed.timestamp}`);
});

test('Example from documentation: 9622927', () => {
  const normalized = 9622927;
  const timestamp = normalized * 180;
  const version = generateVersion(timestamp);
  const parsed = parseVersion(version);

  console.log(`  Timestamp: ${timestamp}`);
  console.log(`  Normalized: ${normalized}`);
  console.log(`  Version: ${version}`);
  console.log(`  Parsed back: ${parsed.timestamp}`);
  console.log(`  Length: ${version.length} chars`);

  assertTrue(version.length >= 6 && version.length <= 20,
    `Version length ${version.length} should be reasonable (6-20 chars)`);
});

console.log('\n=== All tests completed ===\n');
