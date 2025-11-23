# CLAUDE.md - Phonetic Versioning Project

**Inherits from:** `/home/zdendys/CLAUDE.md`
**Project:** Phonetic Version Generator
**Purpose:** Generate unique, pronounceable version names from timestamps using English phonology

---

## 📋 Project Overview

**Goal:** Create linguistically correct, pronounceable version names from build timestamps.

**Challenge:**
- Simple CV (consonant-vowel) pattern is too naive
- Need real English phonotactic rules
- Must handle consonant clusters (bl, str, th, etc.)
- Must create natural-sounding syllables and words

**Current Status:** Initial implementation with simple CV pattern (too simplistic)

---

## 🎯 Requirements

### Phonological Rules (English)

**Syllable Structures:**
1. **V**: "a", "I" (vowel only)
2. **CV**: "ba", "te", "do" (consonant + vowel)
3. **CVC**: "cat", "dog", "bit"
4. **CCV**: "bra", "tri", "sta" (consonant cluster + vowel)
5. **CCVC**: "brat", "stop", "trim"
6. **VCC**: "ast", "ump", "ink" (vowel + consonant cluster)

**Valid Consonant Clusters:**
- **Onset (beginning)**: bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, sc, sk, sl, sm, sn, sp, st, sw, tr, tw, th, sh, ch, wh
- **Coda (ending)**: ft, ld, lt, mp, nd, nt, pt, sk, sp, st, ct, xt

**Invalid Clusters:**
- *bn, *dn, *pn (nasal after stop)
- *tl, *dl (lateral after dental)
- *sr, *zr (sibilant + r)

**Vowel Rules:**
- Short vowels: a, e, i, o, u
- Long vowels (digraphs): aa, ee, oo (optional for variety)
- Diphthongs: ai, ei, oi, ou (optional)

---

## 🔬 Technical Approach

### Algorithm Design

1. **Timestamp → Number**
   - Normalize by BUILD_INTERVAL (180s default)
   - Reduces length while maintaining uniqueness

2. **Number → Base-N Encoding**
   - Use phonemes instead of digits
   - Base-20? Base-30? (depends on phoneme inventory)

3. **Phoneme Sequence → Syllables**
   - Apply phonotactic rules
   - Build valid onset-nucleus-coda structures
   - Create multi-syllable words

4. **Syllables → Pronounceable Words**
   - Combine syllables naturally
   - Ensure no illegal sequences at boundaries
   - Add word boundaries if too long (e.g., "bra-tok-fin")

---

## 📚 Research Topics

### Phonotactic Constraints
- English syllable structure rules
- Sonority Sequencing Principle
- Onset/coda clusters validity
- Cross-linguistic patterns (for international appeal)

### Encoding Strategies
- Map consonants to positions (onset vs coda)
- Use different vowels for different positions
- Encode length information in syllable structure

### Examples from Natural Languages
- Hawaiian: strict CV pattern (simple)
- English: complex clusters (flexible)
- Japanese: mostly CV with some CVC

---

## 🧪 Test Cases

**Input → Expected Output:**
```
Timestamp 1732127000 (/180) = 9622927
→ Should generate: natural-sounding word(s)
→ Examples: "braktofin", "glumexor", "trivoskap"
```

**Validation:**
- ✅ Pronounceable by English speakers
- ✅ Unique for each timestamp
- ✅ Reversible (can decode to timestamp)
- ✅ Reasonable length (8-16 characters ideal)
- ✅ No offensive/awkward combinations

---

## 📁 Project Structure

```
phonetic-versioning/
├── CLAUDE.md          # This file
├── README.md          # Project documentation
├── STATUS.md          # Current progress
├── src/
│   ├── phonology.js   # Phonotactic rules engine
│   ├── encoder.js     # Number → phoneme encoding
│   ├── syllabifier.js # Phoneme → syllable builder
│   └── generator.js   # Main version generator
├── data/
│   ├── clusters.json  # Valid consonant clusters
│   ├── phonemes.json  # Phoneme inventory
│   └── rules.json     # Phonotactic constraints
├── tests/
│   ├── phonology.test.js
│   ├── uniqueness.test.js
│   └── pronounceability.test.js
└── tools/
    └── version-gen.js # CLI tool
```

---

## 🎓 Linguistic Resources

**Key Concepts:**
- **Phonotactics**: Rules governing sound sequences
- **Sonority Hierarchy**: Vowels > Glides > Liquids > Nasals > Fricatives > Stops
- **Syllable Weight**: Light (CV) vs Heavy (CVC, CVV)
- **Onset Maximization**: Prefer CCVC over C.CVC

**Reference Materials:**
- IPA (International Phonetic Alphabet)
- English phonology textbooks
- CMU Pronouncing Dictionary
- CELEX lexical database

---

## 🚀 Implementation Strategy

### Recommended Approach: Koremutake-Style Encoding

Based on research of existing projects (see STATUS.md for details), we'll use a **Koremutake-inspired algorithm**:

**Key Decision:** Use 128 curated English syllables with base-128 encoding for:
- ✅ Proven concept (Koremutake algorithm widely used)
- ✅ Bijective encoding (reversible timestamp ↔ version)
- ✅ Simple implementation (syllable lookup table)
- ✅ Predictable length (3-5 syllables typical)
- ✅ Full aesthetic control (curate each syllable)

**Alternative approaches considered but rejected:**
- ❌ Variable-base encoding: Too complex, unpredictable results
- ❌ Markov chains: Not bijective, requires training data
- ❌ Docker-style two-word: Too long, less elegant

### Phase 1: Syllable Set Design (Day 1)
1. Create 128 English syllables following phonotactic rules
   - 32x CV (ba, te, ko, etc.)
   - 48x CVC (bat, ten, dok, etc.)
   - 24x CCV (bra, tri, glo, etc.)
   - 24x CCVC (brak, stop, trim, etc.)
2. Validate each against phonotactic constraints
3. Filter out offensive/awkward combinations
4. Store in `data/syllables.json` with metadata (sonority, structure type)

### Phase 2: Base-128 Encoder (Day 2)
1. Implement number → base-128 array conversion
2. Map array indices → syllables from lookup table
3. Implement reverse decoder (version → timestamp)
4. Create `src/encoder.js` and `src/decoder.js`

### Phase 3: Testing & Refinement (Day 3)
1. Generate 10,000 sample versions
2. Validate uniqueness (no collisions)
3. Check pronounceability (all phonotactically valid)
4. Measure length distribution (target: 8-16 chars)
5. Human testing for awkward combinations

### Phase 4: Integration (Day 4-5)
1. Replace simple CV generator in MCP servers
2. Update build scripts
3. Document usage and examples
4. Deploy to production

---

## 🔧 Development Notes

**Language:** JavaScript (ES modules, Node.js)
**Testing:** Manual + unit tests
**Documentation:** English (code & comments)

**Quality Standards:**
- All phoneme sequences must be valid
- No hardcoded magic numbers
- Well-documented linguistic rules
- Comprehensive test coverage

---

**Version:** Initial setup
**Created:** 2025-11-20
**Author:** Nyara & Zdendys
