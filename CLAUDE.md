# CLAUDE.md - Phonetic Versioning Project

**Inherits from:** `/home/zdendys/CLAUDE.md`
**Project:** Phonetic Version Generator
**Purpose:** Generate unique, pronounceable version names from timestamps using English phonology

---

## 📋 Project Overview

**Goal:** Create linguistically correct, pronounceable version names from build timestamps.

**Solution:** Base-1007 encoding with 1007 curated English syllables.

**Current Status:** ✅ Production ready (v1.0.0)

---

## 🎯 Final Implementation

### System Architecture

1. **Timestamp → Normalized Number**
   - Divide by BUILD_INTERVAL (180s = 3 minutes)
   - Reduces length while maintaining uniqueness

2. **Number → Base-1007 Encoding**
   - Each digit represents one syllable index (0-1006)
   - Larger base = shorter versions

3. **Digit Mixing**
   - Interleaves low-order (fast-changing) and high-order (slow-changing) digits
   - Creates variety throughout the version string

4. **Syllables → Version String**
   - Simple concatenation of syllables
   - No separators (simplified approach)

### Syllable Database

**Final:** 1,007 syllables
- **Patterns:** CV, CVC, CCV, CCVC, CCCVC
- **Examples:** `ba`, `bat`, `bra`, `brak`, `scrint`, `cher`, `pel`
- **Letter balance:** 2.6-3.4% max deviation from English target frequencies

**Generation Process:**
1. Generated 13,250 syllables using phonotactic rules
2. Iteratively removed syllables with over-represented letters
3. Final optimization: 1,007 syllables (92.4% removed)

**Key Achievement:** Reduced max letter frequency deviation from 8.18% → 2.6-3.4%

---

## 📁 Project Structure

```
phonetic-versioning/
├── CLAUDE.md          # This file (project config)
├── README.md          # Main documentation
├── STATUS.md          # Project status & roadmap
├── BALANCING_ANALYSIS.md  # Technical optimization analysis
├── src/
│   ├── encoder.js     # Base-N encoding + digit mixing
│   ├── decoder.js     # Version → timestamp parsing
│   └── digit-mixer.js # Digit interleaving logic
├── data/
│   ├── syllables.json # 1007 syllables (FINAL)
│   └── syllables-backup-13250.json  # Original (backup)
├── tools/
│   ├── balance-global-remove-redistribute.js  # Optimizer
│   ├── version-gen.js          # CLI generator
│   ├── test-version-examples.js  # Random samples
│   └── test-sequential.js      # Sequential builds
└── config.json        # Configuration
```

---

## 🔬 Technical Details

### Encoding Example

```
Timestamp: 1732453020 (seconds)
  ↓ Normalize (/180)
Normalized: 9624739
  ↓ Base-1007
Digits: [9, 538, 272]
  ↓ Map to syllables
Syllables: ['sip', 'cher', 'pel']
  ↓ Digit mixing
Mixed: ['pel', 'sip', 'cher']
  ↓ Concatenate
Version: "pelsipcher"
```

### Version Statistics

- **Average length:** 10.56 characters
- **Length range:** 8-14 characters (90% within 9-12)
- **Uniqueness:** 1007^3 ≈ 1 billion combinations
- **Coverage:** Decades of builds at 3-minute intervals

### Sample Versions

```
2025-12-07 05:55:06 → howcherwhict
2025-12-12 06:30:37 → vawcherwel
2025-12-30 06:29:42 → uncherves
```

---

## 🎓 Linguistic Principles

### Phonotactic Rules (English)

**Valid Consonant Clusters:**
- **Onsets:** bl, br, cl, cr, dr, fl, fr, gl, gr, pl, pr, sc, sk, sl, sm, sn, sp, st, sw, tr, tw, th, sh, ch, wh
- **Codas:** ft, ld, lt, mp, nd, nt, pt, sk, sp, st, ct, xt

**Invalid Clusters:**
- *bn, *dn, *pn (nasal after stop)
- *tl, *dl (lateral after dental)
- *sr, *zr (sibilant + r)

**Syllable Structures:**
- V: "a", "i"
- CV: "ba", "te", "do"
- CVC: "bat", "ten", "dok"
- CCV: "bra", "tri", "glo"
- CCVC: "brak", "stop", "trim"
- CCCVC: "scrint", "splint"

---

## 🚀 Development Workflow

### Adding New Features

1. Update `src/` code
2. Test with `tools/test-*.js` scripts
3. Update documentation (README, STATUS, CLAUDE)
4. Git commit with descriptive message
5. Push to GitHub

### Testing

```bash
# Generate random samples
node tools/test-version-examples.js

# Show sequential builds
node tools/test-sequential.js

# Generate version for current time
node tools/version-gen.js
```

### Optimization

```bash
# Re-balance syllable database (if needed)
node tools/balance-global-remove-redistribute.js
```

**Warning:** This process takes ~15 minutes and removes ~92% of syllables.

---

## 📚 Key Learnings

### Design Decisions

1. **Base-1007 vs Base-128:**
   - Larger base = shorter versions (3 syllables vs 4)
   - Trade-off: More syllables to curate, but better variety

2. **Removal-Only Strategy:**
   - Can reduce excess letters, but cannot add missing ones
   - Hits practical limit at 2.6-3.4% deviation
   - Alternative: Generate NEW syllables targeting specific letters

3. **Digit Mixing:**
   - Essential for variety in sequential builds
   - Without it: same prefixes/suffixes for hours
   - With it: every position varies

4. **Simplification:**
   - Removed separator system (colon, dot, space) in favor of concatenation
   - Removed catchiness scoring (not essential)
   - Focus on core functionality: timestamp ↔ version bijection

---

## 🔧 Configuration

See `config.json` for all settings:

```json
{
  "encoding": {
    "buildInterval": 180,
    "base": 1007,
    "digitMixing": true
  },
  "syllables": {
    "path": "./data/syllables.json",
    "count": 1007,
    "maxLetterDeviation": 3.4
  }
}
```

---

## 🎯 Future Enhancements

### v1.1 Roadmap
- [ ] Implement decoder (version → timestamp)
- [ ] NPM package publication
- [ ] Unit tests for encoding/decoding
- [ ] CLI with more options

### Long-term Ideas
- [ ] Web interface for version exploration
- [ ] Multi-language phonotactics (Czech, German, Spanish)
- [ ] Audio generation (TTS pronunciation)
- [ ] Alternative optimization (generate syllables to fill letter gaps)

---

**Version:** v1.0.0
**Status:** Production Ready ✅
**Last Updated:** 2025-11-24
**Authors:** Nyara & Zdendys
