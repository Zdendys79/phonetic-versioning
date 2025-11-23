#!/usr/bin/env node
/**
 * Extract uncertain predictions - where AI prediction differs from user annotation
 */

import { readFileSync, writeFileSync } from 'fs';

const trainingSamples = '/home/zdendys/workplace/phonetic-versioning/training-samples.txt';
const predictions = '/home/zdendys/workplace/phonetic-versioning/predictions-round2.txt';
const outputFile = '/home/zdendys/workplace/phonetic-versioning/uncertain-cases.txt';

// Parse user annotations
const trainingContent = readFileSync(trainingSamples, 'utf8');
const userAnnotations = new Map();

for (const line of trainingContent.split('\n')) {
  if (line.includes('→') && !line.startsWith('#')) {
    const [original, corrected] = line.split('→').map(s => s.trim());
    if (original && corrected) {
      userAnnotations.set(original, corrected);
    }
  }
}

// Parse predictions
const predictionsContent = readFileSync(predictions, 'utf8');
const aiPredictions = new Map();

for (const line of predictionsContent.split('\n')) {
  if (line.includes('→') && !line.startsWith('#')) {
    const [original, predicted] = line.split('→').map(s => s.trim());
    if (original && predicted && predicted !== original) { // Only successful predictions
      aiPredictions.set(original, predicted);
    }
  }
}

// Find differences
const uncertain = [];

for (const [original, aiPredicted] of aiPredictions) {
  const userCorrected = userAnnotations.get(original);
  
  if (userCorrected && userCorrected !== aiPredicted) {
    // AI prediction differs from user correction
    uncertain.push({
      original,
      userWants: userCorrected,
      aiGave: aiPredicted,
      difference: describeDifference(userCorrected, aiPredicted)
    });
  }
}

function describeDifference(user, ai) {
  const userSeps = extractSeparators(user);
  const aiSeps = extractSeparators(ai);
  
  const diffs = [];
  
  if (userSeps.hyphen !== aiSeps.hyphen) {
    diffs.push(`HYPHEN: user=${userSeps.hyphen}, ai=${aiSeps.hyphen}`);
  }
  if (userSeps.space !== aiSeps.space) {
    diffs.push(`SPACE: user=${userSeps.space}, ai=${aiSeps.space}`);
  }
  if (userSeps.apostrophe !== aiSeps.apostrophe) {
    diffs.push(`APOSTROPHE: user=${userSeps.apostrophe}, ai=${aiSeps.apostrophe}`);
  }
  if (userSeps.dot !== aiSeps.dot) {
    diffs.push(`DOT: user=${userSeps.dot}, ai=${aiSeps.dot}`);
  }
  if (userSeps.backtick !== aiSeps.backtick) {
    diffs.push(`BACKTICK: user=${userSeps.backtick}, ai=${aiSeps.backtick}`);
  }
  
  return diffs.join('; ');
}

function extractSeparators(str) {
  return {
    hyphen: (str.match(/-/g) || []).length,
    space: (str.match(/ /g) || []).length,
    apostrophe: (str.match(/'/g) || []).length,
    dot: (str.match(/\./g) || []).length,
    backtick: (str.match(/`/g) || []).length
  };
}

// Generate output
const outputLines = [
  '# Uncertain Cases - AI Predictions vs User Annotations',
  '# Format: original → [USER WANTS] vs [AI GAVE]',
  '#',
  `# Total uncertain cases: ${uncertain.length} out of ${aiPredictions.size} successful predictions`,
  `# Agreement rate: ${(((aiPredictions.size - uncertain.length) / aiPredictions.size) * 100).toFixed(1)}%`,
  '',
  '# ============================================================',
  ''
];

uncertain.forEach((u, idx) => {
  outputLines.push(`# [${idx + 1}] ${u.difference}`);
  outputLines.push(`${u.original}`);
  outputLines.push(`  USER: ${u.userWants}`);
  outputLines.push(`  AI:   ${u.aiGave}`);
  outputLines.push('');
});

writeFileSync(outputFile, outputLines.join('\n'), 'utf8');

console.log(`\n=== Uncertain Cases Analysis ===\n`);
console.log(`Total AI predictions: ${aiPredictions.size}`);
console.log(`Matches user annotations: ${aiPredictions.size - uncertain.length}`);
console.log(`Differs from user: ${uncertain.length}`);
console.log(`Agreement rate: ${(((aiPredictions.size - uncertain.length) / aiPredictions.size) * 100).toFixed(1)}%\n`);
console.log(`[OK] Uncertain cases saved to: ${outputFile}\n`);

// Show first 10
console.log('First 10 uncertain cases:');
uncertain.slice(0, 10).forEach((u, idx) => {
  console.log(`\n  [${idx + 1}] ${u.original}`);
  console.log(`      USER: ${u.userWants}`);
  console.log(`      AI:   ${u.aiGave}`);
  console.log(`      DIFF: ${u.difference}`);
});

