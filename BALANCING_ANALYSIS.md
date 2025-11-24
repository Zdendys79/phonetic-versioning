# Letter Frequency Balancing Analysis

## Goal
Generate phonetic versions that match English letter frequency distribution while maximizing syllable variety.

## Target Letter Frequencies
```
e: 12.7%  t: 9.1%   a: 8.2%   o: 7.5%   i: 7.0%
n: 6.7%   s: 6.3%   h: 6.1%   r: 6.0%   d: 4.3%
l: 4.0%   c: 2.8%   u: 2.8%   m: 2.4%   w: 2.4%
f: 2.2%   g: 2.0%   y: 2.0%   p: 1.9%   b: 1.5%
v: 1.0%   k: 0.8%   j: 0.2%   x: 0.2%   q: 0.1%   z: 0.1%
```

## Fundamental Problem: Index Usage Non-Uniformity

### Index Usage Analysis (base-13250)
When encoding timestamps in base-13250:
- **Position 0**: Index 10 appears in 100% of versions (100,000/100,000 samples)
- **Position 1**: Index 625 appears in 13.3% of versions
- **Position 2**: More distributed (~0.01% each)

**Result**: Whatever syllable is at index 10 appears in 33% of ALL syllables across all versions.

### The Impossibility

Given base-N encoding with syllables at indices 0..N-1:
1. **Large base (N=13,250)**:
   - Provides maximum variety
   - Creates 3-syllable versions (desired)
   - BUT index usage is extremely non-uniform (one index = 33% usage)
   - Cannot achieve balanced letter frequency

2. **Small base (N=128)**:
   - Index usage more uniform (max 20.4%)
   - CAN achieve approximate balancing
   - BUT creates 5-syllable versions (undesired)
   - Minimal variety (only 128 syllables)

**Conclusion**: Cannot simultaneously have:
- Large syllable base (13,250+)
- Short versions (3 syllables)
- Balanced letter frequency

This is a **mathematical impossibility** with simple base-N encoding.

## Approaches Tested

### 1. Proportional Assignment (`tools/proportional-assignment.js`)
**Strategy**: Assign syllables to indices proportionally by target frequency
**Result**: FAILED - 72.1% 'e' instead of 12.7%
**Why**: Greedy algorithm put all 1,683 'e' syllables on one high-usage index

### 2. Usage-Aware Assignment (`tools/usage-aware-assignment.js`)
**Strategy**: Assign common letters to low-usage indices
**Result**: FAILED - 72.1% 'e'
**Why**: All 'e' syllables still concentrated on few indices

### 3. Weighted Shuffle (`tools/weighted-shuffle-syllables.js`)
**Strategy**: Round-robin distribution across indices
**Result**: FAILED - 34.2% 'w' instead of 2.4%
**Why**: First letter processed got first indices with high usage

### 4. Multi-Pass Distribution (`tools/multi-pass-distribution.js`)
**Strategy**: Interleave letters across indices
**Result**: FAILED - 42.8% 'l' instead of 4.0%
**Why**: Letter at index 10 dominated due to 100% usage

### 5. Stratified Distribution (`tools/stratified-distribution.js`)
**Strategy**: Proportional assignment across usage levels
**Result**: FAILED - 33.5% 'e'
**Why**: Only assigned one syllable per index on first pass

### 6. Quota-Matching with Smaller Base (`tools/quota-matching-assignment.js`)
**Strategy**: Use base-2048 for better uniformity
**Result**: FAILED - 44.1% 't' instead of 9.1%
**Why**: Even base-2048 has 33% max usage on one index

### 7. Perfect 128-Syllable Set (`tools/perfect-128-syllables.js`)
**Strategy**: Use base-128 (most uniform at 20.4% max usage)
**Result**: PARTIAL SUCCESS
- Perfect matches (<1% diff): 7 letters
- Average difference: 3.31%
- **BUT**: Creates 5-syllable versions instead of 3

### 8. Testing with Digit Interleaving (`tools/test-with-interleaving.js`)
**Strategy**: Use existing digitInterleaving feature
**Result**: Does NOT solve the problem
- Base-128 with interleaving: Still 23.5% 't' and 22.8% 'o'
- Base-13250 with interleaving: 56.4% 'a', 43.6% 'b'

## Best Achievable Result

**Current Best**: Base-128 syllables
```
e:   4.7% (target 12.7%) diff 8.0%
t:  23.5% (target  9.1%) diff 14.4%
o:  22.8% (target  7.5%) diff 15.3%
...
Perfect matches: 7/26
Average diff: 3.32%
Version length: 5 syllables
```

**Trade-offs**:
- ✅ More balanced than large bases
- ✅ Deterministic and reversible
- ❌ Only 128 syllables (minimal variety)
- ❌ 5 syllables per version (vs desired 3)

## Alternative Solutions

### Option A: Accept Approximate Balancing
- Use base-1024 or base-2048
- Accept 5-10% deviation from target frequencies
- Keep 3-4 syllable versions
- Moderate variety

### Option B: Different Encoding Scheme
- Use hash-based syllable selection (non-reversible)
- Use position-dependent lookup tables
- Use multiple smaller bases combined

### Option C: Current System (128 syllables)
- Accept 5-syllable versions
- Accept minimal variety
- Get best possible balancing (~3% avg difference)

## Recommendations

1. **For Maximum Balance**: Use base-128 (current `syllables.json`)
   - Best balance achievable
   - 5 syllables per version
   - Limited variety

2. **For Maximum Variety**: Keep original 13,250 syllables
   - 3 syllables per version
   - High variety
   - Accept imbalanced letter distribution

3. **For Compromise**: Use base-1024 with smart assignment
   - 4 syllables per version
   - Moderate variety
   - Approximate balancing (5-10% error)

## Generated Files

- `data/syllables-backup-13250.json` - Original 13,250 syllables (alphabetically sorted, imbalanced)
- `data/syllables.json` - Current active set (128 syllables, best balanced)
- `tools/generate-11500-syllables.js` - Generates all valid syllables
- `tools/perfect-128-syllables.js` - Creates balanced 128-syllable set
- `tools/test-with-interleaving.js` - Tests actual system behavior with interleaving

## Conclusion

**The user's requirements are mutually exclusive**:
- Maximum syllable variability (13,250+)
- 3-syllable versions
- Balanced English letter frequency

**Choose one**:
1. Variety → imbalanced letters
2. Balanced letters → limited variety OR longer versions
3. Short versions → either imbalanced OR limited variety

This is a fundamental mathematical limitation of base-N positional encoding systems.
