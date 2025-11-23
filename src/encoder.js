/**
 * Base-128 Encoder for Phonetic Versioning
 * Converts numbers to base-128 representation for syllable mapping
 */

/**
 * Convert number to base-128 array
 * @param {number} num - The number to encode
 * @returns {number[]} Array of base-128 digits (0-127)
 */
export function toBase128(num) {
  if (num === 0) return [0];

  const digits = [];
  let remaining = num;

  while (remaining > 0) {
    digits.unshift(remaining % 128);
    remaining = Math.floor(remaining / 128);
  }

  return digits;
}

/**
 * Convert base-128 array back to number
 * @param {number[]} digits - Array of base-128 digits
 * @returns {number} The decoded number
 */
export function fromBase128(digits) {
  let num = 0;

  for (let i = 0; i < digits.length; i++) {
    num = num * 128 + digits[i];
  }

  return num;
}

/**
 * Encode number to syllable indices
 * @param {number} num - The number to encode
 * @param {number} minLength - Minimum number of syllables (padding)
 * @returns {number[]} Array of syllable indices (0-127)
 */
export function encodeToSyllableIndices(num, minLength = 0) {
  const indices = toBase128(num);

  // Pad with zeros if needed
  while (indices.length < minLength) {
    indices.unshift(0);
  }

  return indices;
}

/**
 * Decode syllable indices to number
 * @param {number[]} indices - Array of syllable indices
 * @returns {number} The decoded number
 */
export function decodeSyllableIndices(indices) {
  return fromBase128(indices);
}

/**
 * Interleave digits using 4-step cycle pattern
 *
 * Algorithm:
 * 1. Start with FIRST digit (slowest)
 * 2. Repeat 4-step cycle until all digits consumed:
 *    - Step 0: Take LAST, prepend (unshift)
 *    - Step 1: Take LAST, append (push)
 *    - Step 2: Take FIRST, prepend (unshift)
 *    - Step 3: Take FIRST, append (push)
 *
 * Result: Near-middle digit at position 0, fast/slow mixed!
 *
 * @param {number[]} digits - Original base-128 digits [slow...fast]
 * @returns {number[]} Interleaved digits
 *
 * @example
 * interleaveDigits([1, 2, 3, 4, 5, 6, 7, 8, 9])
 * // → [4, 7, 2, 9, 1, 8, 3, 6, 5]
 */
export function interleaveDigits(digits) {
  if (digits.length === 0) return [];
  if (digits.length === 1) return [...digits];

  const n = digits.length;

  // Start with first (slowest)
  const result = [digits[0]];

  let left = 1;           // Next from front
  let right = n - 1;      // Next from back
  let step = 0;           // 0-3 cycle position

  while (left <= right) {
    const cyclePos = step % 4;

    if (cyclePos === 0) {
      // Last, left (unshift)
      result.unshift(digits[right--]);
    } else if (cyclePos === 1) {
      // Last, right (push)
      result.push(digits[right--]);
    } else if (cyclePos === 2) {
      // First, left (unshift)
      result.unshift(digits[left++]);
    } else {
      // First, right (push)
      result.push(digits[left++]);
    }

    step++;
  }

  return result;
}

/**
 * De-interleave 4-step cycle pattern back to original order
 *
 * Reverses the interleaving by simulating forward algorithm and creating position mapping
 *
 * @param {number[]} digits - Interleaved digits
 * @returns {number[]} Original digits [slow...fast]
 *
 * @example
 * deinterleaveDigits([4, 7, 2, 9, 1, 8, 3, 6, 5])
 * // → [1, 2, 3, 4, 5, 6, 7, 8, 9]
 */
export function deinterleaveDigits(digits) {
  if (digits.length === 0) return [];
  if (digits.length === 1) return [...digits];

  const n = digits.length;

  // Build mapping by simulating forward algorithm
  // Track which original position ended up at which interleaved position
  const dummy = Array.from({ length: n }, (_, i) => i);
  const dummyInterleaved = [dummy[0]];

  let left = 1;
  let right = n - 1;
  let step = 0;

  while (left <= right) {
    const cyclePos = step % 4;

    if (cyclePos === 0) {
      dummyInterleaved.unshift(dummy[right--]);
    } else if (cyclePos === 1) {
      dummyInterleaved.push(dummy[right--]);
    } else if (cyclePos === 2) {
      dummyInterleaved.unshift(dummy[left++]);
    } else {
      dummyInterleaved.push(dummy[left++]);
    }

    step++;
  }

  // dummyInterleaved[i] = original position that ended up at interleaved position i
  // Reconstruct original: result[origPos] = interleaved[interleavedPos]
  const result = new Array(n);
  for (let i = 0; i < n; i++) {
    const origPos = dummyInterleaved[i];
    result[origPos] = digits[i];
  }

  return result;
}
