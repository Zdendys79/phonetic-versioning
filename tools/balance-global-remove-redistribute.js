#!/usr/bin/env node

/**
 * Global remove + redistribute strategy
 *
 * Strategy:
 *   1. Work on ENTIRE database as one unit
 *   2. Remove syllables with over-represented letters (globally)
 *   3. Re-distribute into 12 equal chunks
 *   4. Test each chunk's statistics
 *   5. Repeat until all chunks < 0.5% max diff
 *
 * Benefits:
 *   - Chunks always equal size (automatic)
 *   - Each removal improves ALL chunks (global effect)
 *   - Simple logic, no complex swap/move
 */

import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const targetFrequency = {
  'e': 12.7, 't': 9.1, 'a': 8.2, 'o': 7.5, 'i': 7.0, 'n': 6.7, 's': 6.3,
  'h': 6.1, 'r': 6.0, 'd': 4.3, 'l': 4.0, 'c': 2.8, 'u': 2.8, 'm': 2.4,
  'w': 2.4, 'f': 2.2, 'g': 2.0, 'y': 2.0, 'p': 1.9, 'b': 1.5, 'v': 1.0,
  'k': 0.8, 'j': 0.2, 'x': 0.2, 'q': 0.1, 'z': 0.1
};

const TARGET_MAX_DIFF = 0.5;
const MAX_ITERATIONS = 10000000;
const CHUNK_TARGET_SIZE = 1000; // Target syllables per chunk (dynamic)
const MIN_TOTAL_SYLLABLES = 1000; // Stop when database too small
const SWAP_THRESHOLD = 3000; // Below this, use SWAP instead of REMOVAL
const REDISTRIBUTION_INTERVAL = 100; // Redistribute only every N removals

function countLetters(syllables) {
  const letterCount = {};
  let totalLetters = 0;

  syllables.forEach(syl => {
    for (const char of syl) {
      if (char >= 'a' && char <= 'z') {
        letterCount[char] = (letterCount[char] || 0) + 1;
        totalLetters++;
      }
    }
  });

  return { letterCount, totalLetters };
}

function analyzeDatabase(syllables) {
  const { letterCount, totalLetters } = countLetters(syllables);

  const letterStats = {};
  let maxDiff = 0;
  let worstLetter = null;

  Object.entries(targetFrequency).forEach(([letter, target]) => {
    const count = letterCount[letter] || 0;
    const percent = totalLetters > 0 ? (count / totalLetters * 100) : 0;
    const diff = Math.abs(percent - target);

    letterStats[letter] = {
      count,
      percent,
      target,
      diff,
      needMore: percent < target,
      needLess: percent > target
    };

    if (diff > maxDiff) {
      maxDiff = diff;
      worstLetter = letter;
    }
  });

  return {
    letterStats,
    totalLetters,
    maxDiff,
    worstLetter
  };
}

function analyzeChunk(chunk) {
  const { letterCount, totalLetters } = countLetters(chunk);

  const letterStats = {};
  let maxDiff = 0;
  let worstLetter = null;

  Object.entries(targetFrequency).forEach(([letter, target]) => {
    const count = letterCount[letter] || 0;
    const percent = totalLetters > 0 ? (count / totalLetters * 100) : 0;
    const diff = Math.abs(percent - target);

    letterStats[letter] = {
      count,
      percent,
      target,
      diff,
      needMore: percent < target,
      needLess: percent > target
    };

    if (diff > maxDiff) {
      maxDiff = diff;
      worstLetter = letter;
    }
  });

  return {
    letterStats,
    totalLetters,
    maxDiff,
    worstLetter,
    isBalanced: maxDiff < TARGET_MAX_DIFF
  };
}

function calculateOptimalChunkCount(totalSyllables) {
  // Keep ~1000 syllables per chunk
  return Math.max(1, Math.floor(totalSyllables / CHUNK_TARGET_SIZE));
}

function redistributeIntoChunks(syllables, numChunks) {
  if (numChunks === 1) {
    return [syllables];
  }

  const chunkSize = Math.floor(syllables.length / numChunks);
  const chunks = [];

  for (let i = 0; i < numChunks; i++) {
    const start = i * chunkSize;
    const end = i === numChunks - 1 ? syllables.length : (i + 1) * chunkSize;
    chunks.push(syllables.slice(start, end));
  }

  return chunks;
}

function optimize() {
  console.log('=== Dynamic Chunk Balancer ===\n');
  console.log(`Target: max diff < ${TARGET_MAX_DIFF}% for EACH chunk`);
  console.log(`Strategy: ~${CHUNK_TARGET_SIZE} syllables per chunk (dynamic count)`);
  console.log(`Redistribution: Every ${REDISTRIBUTION_INTERVAL} removals`);
  console.log(`Swap threshold: < ${SWAP_THRESHOLD} syllables`);
  console.log(`Max iterations: ${MAX_ITERATIONS.toLocaleString()}`);
  console.log('');

  // Load syllables
  const syllablesPath = join(__dirname, '../data/syllables-backup-13250.json');
  const data = JSON.parse(readFileSync(syllablesPath, 'utf8'));
  let allSyllables = [...data.syllables];

  console.log(`Loaded ${allSyllables.length} syllables`);

  // Shuffle once at start
  allSyllables = allSyllables.sort(() => Math.random() - 0.5);

  const startTime = Date.now();
  let removedCount = 0;
  let swapCount = 0;
  let lastReportTime = startTime;
  let lastRedistribution = 0;

  // Initial chunk calculation
  let numChunks = calculateOptimalChunkCount(allSyllables.length);
  let chunks = redistributeIntoChunks(allSyllables, numChunks);

  console.log(`Starting with ${numChunks} chunks (${Math.floor(allSyllables.length / numChunks)} syllables each)\n`);

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    // Safety check
    if (allSyllables.length < MIN_TOTAL_SYLLABLES) {
      console.log(`\n⚠️ Reached minimum (${MIN_TOTAL_SYLLABLES} syllables), stopping`);
      break;
    }

    // Recalculate optimal chunk count and redistribute if needed
    const shouldRedistribute = (removedCount - lastRedistribution) >= REDISTRIBUTION_INTERVAL;
    const newOptimalChunks = calculateOptimalChunkCount(allSyllables.length);

    if (shouldRedistribute || newOptimalChunks !== numChunks) {
      numChunks = newOptimalChunks;
      chunks = redistributeIntoChunks(allSyllables, numChunks);
      lastRedistribution = removedCount;

      if (iteration > 0) {
        console.log(`  [REDISTRIBUTE] ${numChunks} chunks × ~${Math.floor(allSyllables.length / numChunks)} syllables`);
      }
    }

    // Analyze each chunk
    const analyses = chunks.map(analyzeChunk);
    const balancedCount = analyses.filter(a => a.isBalanced).length;
    const overallMaxDiff = Math.max(...analyses.map(a => a.maxDiff));

    // Check if all chunks balanced
    if (balancedCount === numChunks) {
      console.log(`\n🎉 SUCCESS! All ${numChunks} chunks balanced after ${iteration.toLocaleString()} iterations!`);
      break;
    }

    // Find worst chunk
    const worstChunkIdx = analyses
      .map((a, i) => ({ idx: i, maxDiff: a.maxDiff }))
      .sort((a, b) => b.maxDiff - a.maxDiff)[0].idx;

    const worstAnalysis = analyses[worstChunkIdx];
    const worstChunk = chunks[worstChunkIdx];

    // Find worst over-represented letter in worst chunk
    const overRepresented = Object.entries(worstAnalysis.letterStats)
      .filter(([_, stats]) => stats.needLess)
      .sort((a, b) => b[1].diff - a[1].diff);

    if (overRepresented.length === 0) {
      console.log(`\n⚠️ No over-represented letters in worst chunk (${worstChunkIdx + 1})`);
      break;
    }

    const [worstLetter, stats] = overRepresented[0];

    // Find best syllable to remove FROM WORST CHUNK
    let bestLocalIdx = null;
    let bestScore = -Infinity;

    for (let localIdx = 0; localIdx < worstChunk.length; localIdx++) {
      const syl = worstChunk[localIdx];

      if (syl.includes(worstLetter)) {
        // Score this syllable by total "problem letters" it contains
        let problemScore = 0;

        for (const char of syl) {
          if (char >= 'a' && char <= 'z') {
            const letterStat = worstAnalysis.letterStats[char];
            if (letterStat && letterStat.needLess) {
              problemScore += letterStat.diff;
            }
          }
        }

        if (problemScore > bestScore) {
          bestScore = problemScore;
          bestLocalIdx = localIdx;
        }
      }
    }

    if (bestLocalIdx === null) {
      console.log(`\n⚠️ Cannot find syllable with '${worstLetter}' to remove from worst chunk`);
      break;
    }

    // Decide: REMOVE or SWAP?
    if (allSyllables.length > SWAP_THRESHOLD) {
      // REMOVAL MODE
      const chunkSize = Math.floor(allSyllables.length / numChunks);
      const globalIdx = worstChunkIdx * chunkSize + bestLocalIdx;

      allSyllables.splice(globalIdx, 1);
      removedCount++;

      // Also remove from chunks array (no redistribution!)
      chunks[worstChunkIdx].splice(bestLocalIdx, 1);

    } else {
      // SWAP: Below threshold, swap between chunks to balance statistics
      // Find best partner chunk (one that needs what worst chunk has too much of)
      let bestPartnerIdx = null;
      let bestSwapLocalIdx = null;
      let bestSwapScore = -Infinity;

      for (let partnerIdx = 0; partnerIdx < numChunks; partnerIdx++) {
        if (partnerIdx === worstChunkIdx) continue;

        const partnerChunk = chunks[partnerIdx];
        const partnerAnalysis = analyses[partnerIdx];

        // Find syllable in partner that has letters worst chunk needs
        for (let localIdx = 0; localIdx < partnerChunk.length; localIdx++) {
          const syl = partnerChunk[localIdx];
          let swapScore = 0;

          // Score: how much does this swap help both chunks?
          for (const char of syl) {
            if (char >= 'a' && char <= 'z') {
              // This syllable goes TO worst chunk
              if (worstAnalysis.letterStats[char]?.needMore) {
                swapScore += worstAnalysis.letterStats[char].diff;
              }
              // Worst chunk's syllable goes TO partner
              if (partnerAnalysis.letterStats[worstLetter]?.needMore) {
                swapScore += partnerAnalysis.letterStats[worstLetter].diff;
              }
            }
          }

          if (swapScore > bestSwapScore) {
            bestSwapScore = swapScore;
            bestPartnerIdx = partnerIdx;
            bestSwapLocalIdx = localIdx;
          }
        }
      }

      if (bestPartnerIdx !== null && bestSwapLocalIdx !== null) {
        // Perform swap in flat array
        const chunkSize = Math.floor(allSyllables.length / numChunks);
        const worstGlobalIdx = worstChunkIdx * chunkSize + bestLocalIdx;
        const partnerGlobalIdx = bestPartnerIdx * chunkSize + bestSwapLocalIdx;

        // Swap in flat array
        const temp = allSyllables[worstGlobalIdx];
        allSyllables[worstGlobalIdx] = allSyllables[partnerGlobalIdx];
        allSyllables[partnerGlobalIdx] = temp;

        // Also swap in chunks array
        const tempChunk = chunks[worstChunkIdx][bestLocalIdx];
        chunks[worstChunkIdx][bestLocalIdx] = chunks[bestPartnerIdx][bestSwapLocalIdx];
        chunks[bestPartnerIdx][bestSwapLocalIdx] = tempChunk;

        swapCount++;
      }
    }

    // Progress report every 3 seconds
    const now = Date.now();
    if (now - lastReportTime >= 3000) {
      const elapsed = ((now - startTime) / 1000).toFixed(0);
      const mode = allSyllables.length > SWAP_THRESHOLD ? 'REMOVE' : 'SWAP';
      const avgChunkSize = Math.floor(allSyllables.length / numChunks);

      console.log(`[${elapsed}s] ${mode} Iter ${iteration.toLocaleString()}: Removed ${removedCount.toLocaleString()} | Swaps ${swapCount.toLocaleString()} | Max ${overallMaxDiff.toFixed(2)}% | Balanced ${balancedCount}/${numChunks} | Total ${allSyllables.length.toLocaleString()} | Chunks ${numChunks}×${avgChunkSize}`);
      lastReportTime = now;
    }
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

  // Final analysis (redistribute one last time for equal chunk sizes)
  chunks = redistributeIntoChunks(allSyllables, numChunks);
  const analyses = chunks.map(analyzeChunk);
  const overallMaxDiff = Math.max(...analyses.map(a => a.maxDiff));
  const avgMaxDiff = analyses.reduce((sum, a) => sum + a.maxDiff, 0) / numChunks;
  const balancedCount = analyses.filter(a => a.isBalanced).length;
  const minSize = Math.min(...chunks.map(c => c.length));
  const maxSize = Math.max(...chunks.map(c => c.length));

  console.log('\n' + '='.repeat(60));
  console.log('FINAL RESULTS');
  console.log('='.repeat(60));
  console.log('');

  chunks.forEach((chunk, i) => {
    const a = analyses[i];
    const status = a.isBalanced ? '✅' : '❌';
    console.log(`Chunk ${(i+1).toString().padStart(2)}: ${chunk.length.toString().padStart(5)} syllables, max diff ${a.maxDiff.toFixed(4)}% ${status}`);
  });

  const originalCount = 13250;
  console.log('');
  console.log(`Total syllables:     ${allSyllables.length.toLocaleString()} (started with ${originalCount.toLocaleString()})`);
  console.log(`Removed:             ${removedCount.toLocaleString()} (${((removedCount / originalCount) * 100).toFixed(1)}%)`);
  console.log(`Swapped:             ${swapCount.toLocaleString()}`);
  console.log(`Preserved:           ${((allSyllables.length / originalCount) * 100).toFixed(1)}%`);
  console.log(`Final chunks:        ${numChunks} × ~${Math.floor(allSyllables.length / numChunks)} syllables`);
  console.log(`Chunk sizes:         ${minSize}-${maxSize} syllables`);
  console.log(`Overall max diff:    ${overallMaxDiff.toFixed(4)}%`);
  console.log(`Average max diff:    ${avgMaxDiff.toFixed(4)}%`);
  console.log(`Balanced chunks:     ${balancedCount}/${numChunks}`);
  console.log(`Total time:          ${totalTime}s`);
  console.log('');

  if (balancedCount === numChunks) {
    console.log('🎉 SUCCESS! All chunks balanced!');
  } else {
    console.log(`⚠️ ${balancedCount} out of ${numChunks} chunks balanced`);
  }

  // Save result (flatten chunks into single array)
  const flatSyllables = chunks.flat();

  const outputData = {
    syllables: flatSyllables,
    metadata: {
      count: flatSyllables.length,
      generated: new Date().toISOString(),
      phonotactics: 'English',
      distribution: `Dynamic chunks (${numChunks} final, ~${CHUNK_TARGET_SIZE} per chunk)`,
      chunks: {
        count: numChunks,
        targetSize: CHUNK_TARGET_SIZE,
        maxDiff: overallMaxDiff.toFixed(4),
        avgMaxDiff: avgMaxDiff.toFixed(4),
        balancedCount,
        removed: removedCount,
        swapped: swapCount,
        sizeRange: `${minSize}-${maxSize}`,
        analyses: analyses.map((a, i) => ({
          chunk: i + 1,
          syllables: chunks[i].length,
          maxDiff: a.maxDiff.toFixed(4),
          balanced: a.isBalanced
        }))
      }
    }
  };

  const dbPath = join(__dirname, '../data/syllables.json');
  writeFileSync(dbPath, JSON.stringify(outputData, null, 2));
  console.log(`\n[OK] Saved to: ${dbPath}`);
}

optimize();
