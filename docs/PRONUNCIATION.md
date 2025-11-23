# Pronunciation Guide & Catchiness Features

**Status:** Production Ready ✅

---

## Overview

Every phonetic version comes with:
- **IPA transcription** - International Phonetic Alphabet notation
- **Stress patterns** - Where to emphasize when pronouncing
- **Catchiness score** - How memorable the version is (0-100)
- **Fantasy nickname** - Creative title inspired by phonetic properties

---

## Features

### 1. IPA Pronunciation

Each version gets IPA (International Phonetic Alphabet) transcription:

```
brakdrak → /bɹək.dɹək/
bunokfenga → /bʌ.nɒk.fɛn.gə/
brabrakflum → /bɹə.bɹək.flʌm/
```

**Simplified IPA mapping:**
- Vowels: a→ə, e→ɛ, i→ɪ, o→ɒ, u→ʌ
- Consonants: r→ɹ (English approximant)
- Clusters: th→θ, sh→ʃ, ch→tʃ

### 2. Stress Patterns

First syllable is stressed by default (uppercase):

```
BRAK-drak
BU-nok-fen-ga
BRA-brak-flum
```

Pronounce: "BRAK drak", "BU nok fen ga"

### 3. Catchiness Scoring

**Algorithm detects 6 phonetic features:**

1. **Rhyming** (15 pts each) - Same ending sounds
   - `brakdrak` → "ak" ending × 2 = +15 pts

2. **Alliteration** (10 pts each) - Same starting consonant
   - `brabrakflum` → "b" start × 2 = +10 pts

3. **Rhythmic** (20 pts) - Alternating syllable lengths
   - `CV-CVC-CV-CVC` pattern = +20 pts

4. **Compact** (10 pts) - Sweet spot: 3-4 syllables, ≤15 chars
   - `brakdrak` (2 syl, 8 chars) = +10 pts

5. **Strong Clusters** (5 pts each) - br, dr, fl, gl, pr, tr, st, sk
   - `brabrakflum` → br×2, fl×1 = +15 pts

6. **Palindrome** (30 pts) - Same forwards/backwards
   - Rare but instant legendary status!

**Ratings:**
- 🔥 **Legendary** (60+) - Exceptionally memorable
- ⭐ **Memorable** (40+) - Very catchy
- ✓ **Good** (20+) - Pleasant to say
- ○ **Plain** (<20) - Functional

### 4. Fantasy Nicknames

Generated from phonetic properties:

**Starting sound determines first title:**
- b → Bold, Brave, Blazing
- d → Daring, Dark, Divine
- f → Fierce, Fleet, Frost
- g → Great, Golden, Grim
- k → Keen, Kind, Kingly
- l → Loyal, Lost, Luminous
- m → Mighty, Mystic, Mad
- r → Royal, Raging, Radiant
- s → Swift, Silent, Sacred

**Ending sound determines second title:**
- k → Seeker, Walker, Breaker
- t → Heart, Knight, Spirit
- n → Born, Crown, Stone
- m → Storm, Doom, Dream
- l → Soul, Fall, Will

**Examples:**
```
brakdrak → Brakdrak the Blazing Breaker
bunokfenga → Bunokfenga the Brave
gilupflakgen → Gilupflakgen the Golden Crown
bubrabubra → Bubrabubra the Brave (95/100 🔥)
```

---

## Usage

### CLI Tool: Full Pronunciation Guide

```bash
node tools/version-pronounce.js [timestamp] [--sep|--plain]
```

**Example output:**
```
VERSION:      bu.brabuhom
IPA:          /bʌ.bɹə.bʌ.hɒm/
Stress:       BU-bra-bu-hom
CATCHINESS:   Legendary (70/100)
  Features:   Rhyme (x1), Alliteration (x2), Rhythmic, Compact
NICKNAME:     Bubrabuhom the Brave Doom
```

### Hall of Fame: Find Legendary Versions

```bash
node tools/hall-of-fame.js [count]
```

Scans N versions and ranks by catchiness:

```
[GOLD] bu.brabubra - 95/100
  Bubrabubra the Brave
  Rhyme (x2), Alliteration (x3), Rhythmic, Compact

[SILVER] bu.brabudra - 90/100
  Bubrabudra the Brave
  Rhyme (x2), Alliteration (x2), Rhythmic, Compact

Statistics:
  Legendary (60+):  68%
  Memorable (40+):  70%
  Good (20+):       93%
```

### Programmatic API

```javascript
import { getPronunciationGuide } from './src/pronunciation.js';
import { parseVersionToSyllables } from './src/decoder.js';

const syllables = parseVersionToSyllables('brakdrak');
const guide = getPronunciationGuide(syllables);

console.log(guide.ipa);         // /bɹək.dɹək/
console.log(guide.stress);      // BRAK-drak
console.log(guide.catchiness);  // { score: 25, rating: 'Good', ... }
console.log(guide.nickname);    // Brakdrak the Blazing Breaker
```

---

## Statistics

Based on 100-version sample:

- **68%** of versions are Legendary (60+)
- **93%** score Good or higher (20+)
- **Only 7%** are Plain (<20)

Our phonetic alphabet is optimized for memorability!

---

## Inspiration

**Ubuntu** - Alliterative animals (Lucid Lynx, Maverick Meerkat)
**Android** - Desserts (Froyo, Gingerbread, Ice Cream Sandwich)
**Debian** - Toy Story characters
**OGRE** - Lovecraftian creatures

Our system: **Phonetic catchiness + Fantasy titles**

---

## Technical Details

### Catchiness Algorithm

```javascript
score = 0
+ (rhyming_syllables × 15)
+ (alliteration_count × 10)
+ (rhythmic_pattern ? 20 : 0)
+ (compact_size ? 10 : 0)
+ (strong_clusters × 5)
+ (palindrome ? 30 : 0)
```

### IPA Mapping

See `src/pronunciation.js` for full phoneme mapping.

Uses simplified English IPA subset:
- 5 vowels (ə, ɛ, ɪ, ɒ, ʌ)
- Standard consonants
- 3 clusters (θ, ʃ, tʃ)

### Stress Rules

- **Default:** First syllable stressed (most common in English)
- **Future:** Could detect heavy syllables (CVC) and apply stress there

---

## Future Enhancements

1. **Audio Generation** - Text-to-speech for each version
2. **Similarity Detection** - Find "version families" (similar phonetics)
3. **Multiple Stress Patterns** - Trochaic vs iambic
4. **Cultural Themes** - Greek gods, Norse mythology, sci-fi planets
5. **Emoji Representations** - Visual catchiness indicator

---

**Version:** 2025-11-20
**Created by:** Nyara (inspired by Ubuntu, Android, and IPA quirkiness)
