/**
 * Digit Mixer - Interleave decimal digits before base-N encoding
 *
 * Purpose: Distribute fast/slow changing digits across multiple groups
 * so that when encoded in large base (base-13250), each resulting digit
 * changes at a similar rate.
 *
 * Example timestamp: 1732127000
 * Positions (slow→fast): JIHGFEDCBA
 *
 * Group assignments:
 * - Group 1: a,j,d,g (fastest + slowest + medium-fast + medium-slow)
 * - Group 2: b,i,e (fast + slow + medium)
 * - Group 3: c,h,f (medium-fast + medium-slow + medium)
 */

/**
 * Mix decimal digits into groups
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Mixed decimal string
 */
export function mixDecimalDigits(timestamp) {
  // Convert to string and pad to 10 digits
  const str = timestamp.toString().padStart(10, '0');

  // Extract positions (A=rightmost/fastest, J=leftmost/slowest)
  const a = str[9];  // Ones (fastest)
  const b = str[8];  // Tens
  const c = str[7];  // Hundreds
  const d = str[6];  // Thousands
  const e = str[5];  // Ten thousands
  const f = str[4];  // Hundred thousands
  const g = str[3];  // Millions
  const h = str[2];  // Ten millions
  const i = str[1];  // Hundred millions
  const j = str[0];  // Billions (slowest)

  // Create 3 groups with mixed fast/slow positions
  const group1 = a + j + d + g;  // Fast, Slowest, Medium-fast, Medium-slow
  const group2 = b + i + e;      // Fast, Slow, Medium
  const group3 = c + h + f;      // Medium-fast, Medium-slow, Medium

  return group1 + group2 + group3;
}

/**
 * Unmix decimal digits back to original order
 * @param {string} mixed - Mixed decimal string (10 digits)
 * @returns {number} Original timestamp
 */
export function unmixDecimalDigits(mixed) {
  if (mixed.length !== 10) {
    throw new Error(`Expected 10 digits, got ${mixed.length}`);
  }

  // Extract from groups
  const group1 = mixed.substring(0, 4);  // a,j,d,g
  const group2 = mixed.substring(4, 7);  // b,i,e
  const group3 = mixed.substring(7, 10); // c,h,f

  const a = group1[0];
  const j = group1[1];
  const d = group1[2];
  const g = group1[3];

  const b = group2[0];
  const i = group2[1];
  const e = group2[2];

  const c = group3[0];
  const h = group3[1];
  const f = group3[2];

  // Reconstruct original order: JIHGFEDCBA
  const original = j + i + h + g + f + e + d + c + b + a;

  return parseInt(original, 10);
}

/**
 * Encode timestamp with digit mixing
 * @param {number} timestamp - Unix timestamp
 * @returns {number} Mixed number ready for base-N encoding
 */
export function encodeWithMixing(timestamp) {
  const mixed = mixDecimalDigits(timestamp);
  return parseInt(mixed, 10);
}

/**
 * Decode from mixed number back to timestamp
 * @param {number} mixedNum - Mixed number from base-N decoding
 * @returns {number} Original timestamp
 */
export function decodeFromMixing(mixedNum) {
  const mixed = mixedNum.toString().padStart(10, '0');
  return unmixDecimalDigits(mixed);
}
