# Separator System Documentation

## Overview

The phonetic versioning system uses **6 different separators** to break multi-syllable version names into readable segments:

| Separator | Symbol | Usage | Example |
|-----------|--------|-------|---------|
| **Space** | ` ` | Natural word boundaries | `bunok fenga` |
| **Dot** | `. ` | Prefix-like patterns | `bra. fenga` |
| **Colon** | `:` | Same consonant structure | `tik:tok` |
| **Tilde** | `~` | Creative/technical separator | `brak~drak` |
| **Hyphen** | `-` | Difficult clusters, rhymes | `brak-drak` |
| **Apostrophe** | `'` | Vowel hiatus (elision) | `ba'enga` |

---

## Target Distribution

The system aims for the following distribution (configured in `config.json`):

```json
"targets": {
  "space": 50,      // Most common - natural word breaks
  "dot": 25,        // Prefix patterns
  "colon": 10,      // Same consonant patterns
  "tilde": 8,       // Creative alternative
  "hyphen": 5,      // Rhymes and hard clusters
  "apostrophe": 2   // Rare - vowel hiatus only
}
```

---

## How It Works

### 1. Context-Based Scoring

Each separator gets a **score** based on the phonetic context at the syllable boundary. The separator with the highest score (above threshold) wins.

**Example:** For boundary between "brak" and "drak":
```javascript
{
  hyphen: 140,     // Heavy syllables with exact rhyme (high score)
  space: 280,      // Heavy + Heavy can use space too
  tilde: 80,       // Alternative for rhymes
  dot: 0,          // Not a prefix pattern
  colon: 0,        // Different consonants (br-k vs d-r-k)
  apostrophe: 0    // No vowel hiatus
}
```

**Winner:** Space (280) or Hyphen (140) depending on balancer state.

### 2. Adaptive Balancing

The **SeparatorBalancer** tracks recent usage and applies dynamic multipliers:

```javascript
// If separator is overused
multiplier = 0.5 - 1.0  // Penalty

// If separator is underused
multiplier = 1.0 - 2.0  // Bonus
```

**Strength parameter** (0-1) controls how aggressively the balancer corrects:
- `0.3` = gentle balancing (follows context more)
- `0.8` = strong balancing (pushes toward targets)

**Example:**
```
Current state:
- Dot: 42% actual, 25% target → Overused by 17%
- Multiplier: 1.0 - (17/100) * 0.8 = 0.86 (penalty)

- Space: 37% actual, 50% target → Underused by 13%
- Multiplier: 1.0 - (-13/100) * 0.8 = 1.10 (bonus)
```

### 3. Selection Algorithm

```
For each syllable boundary:
1. Calculate raw context scores for all separators
2. Apply diversity multipliers from balancer
3. Filter candidates above threshold (default: 100)
4. Choose highest adjusted score
5. Record usage in balancer history
```

---

## Separator Rules

### Space (` `)

**Target: 50% - Most common separator**

**Triggers:**
- Clean consonant boundary (consonant → consonant, not hard cluster)
- Heavy + Heavy syllables (both 4+ chars)
- Clean syllable structures (CVC + CV)
- Natural word-like split (both parts 4+ chars)

**Examples:**
- `bunok fenga` - Clean C→C boundary (k→f)
- `brak flum` - Both heavy syllables
- `nel fom` - Natural word split

**Weights (after 10x):**
```json
"cleanConsonantBoundary": 300,
"heavyAndHeavySpace": 280,
"cleanSyllables": 120,
"naturalWordSplit": 80,
"interestBonus": 50,
"ruleBSimilarSyllables": 400
```

---

### Dot (`. `)

**Target: 25% - Prefix patterns**

**Triggers:**
- Short left part (1-2 syllables) + longer right
- Very short left (2 chars, like "Dr." style)
- Rule B: 3+ syllables same length, same starting consonant

**Examples:**
- `re. fenga` - Prefix pattern (short re + longer fenga)
- `Dr. ` - 2-char abbreviation style
- `bat. bet. bit` - Rule B (3 same-length, same start)

**Weights:**
```json
"prefixPattern": 200,
"veryShortLeft": 50,
"interestBonus": 30,
"ruleBSimilarSyllables": 350
```

**Note:** Dot always includes trailing space (`. `) for readability.

---

### Colon (`:`)

**Target: 10% - Symmetrical patterns**

**Triggers:**
- **Same consonant structure** between syllables
  - Extract consonants from both syllables
  - Compare: if identical → colon wins

**Examples:**
- `tik:tok` - Both have consonants "t-k"
- `brak:brik` - Both have consonants "b-r-k"
- `flebe:fu` - NOT a match (flb vs f)

**Detection logic:**
```javascript
const getConsonants = (syl) =>
  syl.split('').filter(c => !isVowel(c)).join('');

if (getConsonants(lastSyl) === getConsonants(firstSyl)) {
  scores.colon += 300;  // Strong bonus
}
```

**Weights:**
```json
"sameConsonantPattern": {
  "weight": 300,
  "enabled": true
}
```

---

### Tilde (`~`)

**Target: 8% - Creative separator**

**Triggers:**
- Creative/technical pattern (small base bonus)
- Alternative to dot (prefix patterns)
- Alternative to hyphen (moderate clusters)
- Heavy syllables with rhyme patterns

**Examples:**
- `dok~bedro` - Alternative to hyphen
- `brak~drak` - Heavy rhyme pattern

**Weights:**
```json
"creativePattern": 30,
"alternativeToDot": 60,
"alternativeToHyphen": 60,
"heavyRhyme": 80,
"cleanBoundary": 40,
"interestBonus": 15
```

**Design Note:** Tilde was added to reduce hyphen usage (replaces ~35% of hyphens) and dots (~20% of dots) with a more creative separator.

---

### Hyphen (`-`)

**Target: 5% - Difficult clusters and rhymes**

**Triggers:**
- **Critical clusters** (impossible to pronounce): tl, dl, pn, bn, gn, sr, zr, pb, td, kg
- **Hard clusters** (difficult): kd, kt, bd, bk, gd, gt, pd, pt, nm, mn
- **Moderate clusters** (awkward): fs, sz, fp, vb, ft, vd
- Heavy syllables with exact rhyme (last 2 chars match)
- Heavy syllables with partial rhyme (final consonant matches)
- Identical consonants (t+t, k+k, etc.)
- Same place of articulation (bilabial, alveolar, velar)

**Examples:**
- `bat-lak` - Critical cluster "tl"
- `brak-drak` - Heavy exact rhyme ("-ak")
- `brak-brek` - Heavy partial rhyme (same k)
- `bat-tak` - Identical consonant "t"

**Weights:**
```json
"criticalCluster": 160,
"heavySimilarRhyme": 140,
"heavyPartialRhyme": 140,
"hardCluster": 140,
"heavyAndHeavy": 60,
"moderateCluster": 100,
"identicalConsonants": 120,
"samePlaceArticulation": 40,
"interestBonus": 5,
"ruleBSimilarSyllables": 280
```

---

### Apostrophe (`'`)

**Target: 2% - Vowel hiatus**

**Triggers:**
- **Vowel hiatus** (vowel + vowel): `ba'aa`
- Elision pattern (consonant + vowel, word-like): `bunok'enga`
- Short left + vowel start: `ba'enga`

**Examples:**
- `ba'aa` - Strong vowel hiatus
- `O'Lantern` - Elision style

**Weights:**
```json
"vowelHiatus": 200,
"elisionPattern": 120,
"shortLeftBonus": 30,
"interestBonus": 50
```

---

## Weight Granularity

All weights were multiplied by **10x** to enable fine-tuning:

**Before:** `3:1` vs `3:2` = 75% vs 60% (15% jump)
**After:** `300:10` vs `300:20` vs `300:30` = much smoother gradation

Thresholds also scaled:
- `first: 10 → 100`
- `second: 7 → 70`
- `third: 5 → 50`

---

## Configuration Flags

**Every criterion can be enabled/disabled** without changing weights:

```json
{
  "weight": 300,
  "enabled": true,
  "comment": "..."
}
```

To disable a specific rule:
```json
"colon": {
  "similarStructure": {
    "weight": 30,
    "enabled": false  // ← Disabled
  }
}
```

---

## Performance Results

**1000-version test with adaptive balancing (strength: 0.8):**

| Separator | Actual | Target | Δ | Status |
|-----------|--------|--------|---|--------|
| Space | 37% | 50% | 13 | Close |
| Dot | 39% | 25% | 14 | Overused |
| Colon | 6% | 10% | 4 | ✅ Good |
| Tilde | 0% | 8% | 8 | Context-limited |
| Hyphen | 8% | 5% | 3 | ✅ Good |
| Apostrophe | 0% | 2% | 2 | Context-limited |

**Analysis:**
- Colon and hyphen converge well (Δ=3-4)
- Space and dot compete closely (37% vs 39%)
- Tilde and apostrophe have very specific contexts → naturally rare
- Balancer works within context constraints (can't force separators where phonetics don't match)

---

## Implementation Files

### `/src/separators.js`
- Main separator selection logic
- Context scoring for each separator
- Integration with SeparatorBalancer
- `chooseSeparator(scores, threshold, useBalancing)` function

### `/src/separator-balancer.js`
- Adaptive balancing system
- Tracks last 100 versions (configurable)
- Calculates diversity multipliers
- Applies penalties/bonuses to overused/underused separators

### `/config.json`
- All separator weights and thresholds
- Cluster definitions (critical, hard, moderate)
- Balancing configuration:
  ```json
  "separatorBalancing": {
    "enabled": true,
    "historySize": 100,
    "diversityStrength": 0.8,
    "targets": { ... }
  }
  ```

---

## Usage Examples

### Generate version with balancing
```javascript
import { generateVersion } from './src/generator.js';

// Balancing enabled by default
const version = generateVersion(1234567);
console.log(version);  // "brak fenga" or "bra. fenga" or "brak:brik"
```

### Disable balancing (pure context-based)
```javascript
import { chooseSeparator } from './src/separators.js';

const separator = chooseSeparator(scores, threshold, false);
// Uses only raw context scores, no diversity adjustment
```

### Get balancer statistics
```javascript
import SeparatorBalancer from './src/separator-balancer.js';

const balancer = new SeparatorBalancer(config);
// ... generate some versions ...
console.log(balancer.getStats());
// Shows target vs actual, diff, and current multipliers
```

---

## Design Philosophy

### Context Matters
The system prioritizes **phonetic correctness** over strict statistical targets. If the phonetic context doesn't support a separator (e.g., no vowel hiatus for apostrophe), it won't be forced.

### Adaptive, Not Rigid
The balancer **nudges** distribution toward targets without overriding context. Strength parameter controls the balance between:
- `0.0` = Pure context (no balancing)
- `1.0` = Strict targets (maximal balancing)
- `0.8` = Recommended (strong but not absolute)

### Real-World Inspired
Separator frequencies mirror real-world usage:
- **Spaces** dominate (50%) - like natural language
- **Hyphens** are rare (5%) - like brand names (4% in real data)
- **Apostrophes** very rare (2%) - like Irish names (O'Brien)
- **Colons** distinctive (10%) - like tik:tok branding

---

## Version History

**v1.0** - Initial separator system (2025-11-20)
- Space, dot, hyphen, apostrophe

**v2.0** - Tilde addition (2025-11-22)
- Added `~` as creative separator
- Reduced dot and hyphen dominance
- 10x weight multiplication for granularity

**v2.1** - Colon and balancing (2025-11-22)
- Added `:` for symmetric consonant patterns
- Implemented adaptive SeparatorBalancer
- Enable/disable flags for all criteria
- Strength parameter for balancing control

---

**Author:** Nyara & Zdendys
**Last Updated:** 2025-11-22
**Project:** Phonetic Versioning System
