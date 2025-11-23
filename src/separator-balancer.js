/**
 * Adaptive Separator Balancing
 *
 * System that balances separator usage based on:
 * - Context-based weights (from config)
 * - Recent usage history (diversity)
 * - Target distribution goals
 */

/**
 * Track recent separator usage for diversity balancing
 */
class SeparatorBalancer {
  constructor(config = {}) {
    this.historySize = config.historySize || 100;
    this.history = [];

    // Target distribution (percentages)
    this.targets = config.targets || {
      space: 50,
      dot: 25,
      colon: 10,
      tilde: 8,
      hyphen: 5,
      apostrophe: 2
    };

    // Diversity multiplier strength (0-1, where 1 = strict balancing)
    this.diversityStrength = config.diversityStrength || 0.3;
  }

  /**
   * Add separator to history
   */
  recordUsage(separator) {
    this.history.push(separator);
    if (this.history.length > this.historySize) {
      this.history.shift();
    }
  }

  /**
   * Get current usage percentages
   */
  getCurrentDistribution() {
    if (this.history.length === 0) return {};

    const counts = {};
    for (const sep of this.history) {
      counts[sep] = (counts[sep] || 0) + 1;
    }

    const dist = {};
    for (const sep in counts) {
      dist[sep] = (counts[sep] / this.history.length) * 100;
    }

    return dist;
  }

  /**
   * Calculate diversity multiplier for each separator
   *
   * If separator is overused (above target), reduce its score
   * If separator is underused (below target), boost its score
   */
  getDiversityMultipliers() {
    const current = this.getCurrentDistribution();
    const multipliers = {};

    for (const sep in this.targets) {
      const target = this.targets[sep];
      const actual = current[sep] || 0;
      const diff = actual - target;

      // Calculate penalty/bonus
      // If diff > 0: overused → penalty (< 1.0)
      // If diff < 0: underused → bonus (> 1.0)
      const adjustment = 1.0 - (diff / 100) * this.diversityStrength;

      // Clamp between 0.5 and 2.0
      multipliers[sep] = Math.max(0.5, Math.min(2.0, adjustment));
    }

    return multipliers;
  }

  /**
   * Apply diversity balancing to scores
   *
   * @param {Object} scores - Raw scores from context analysis
   * @returns {Object} Adjusted scores with diversity multipliers
   */
  adjustScores(scores) {
    const multipliers = this.getDiversityMultipliers();
    const adjusted = {};

    for (const sep in scores) {
      const multiplier = multipliers[sep] || 1.0;
      adjusted[sep] = scores[sep] * multiplier;
    }

    return adjusted;
  }

  /**
   * Choose best separator with context + diversity
   *
   * @param {Object} rawScores - Scores from context analysis
   * @param {number} threshold - Minimum score threshold
   * @returns {string|null} Chosen separator or null
   */
  chooseSeparator(rawScores, threshold = 100) {
    // Apply diversity adjustments
    const adjustedScores = this.adjustScores(rawScores);

    // Filter by threshold
    const candidates = Object.entries(adjustedScores)
      .filter(([_, score]) => score >= threshold)
      .sort((a, b) => b[1] - a[1]);

    if (candidates.length === 0) return null;

    const [winner, score] = candidates[0];

    // Record usage for diversity tracking
    this.recordUsage(winner);

    return winner;
  }

  /**
   * Get balancing statistics
   */
  getStats() {
    const current = this.getCurrentDistribution();
    const multipliers = this.getDiversityMultipliers();

    const stats = {};
    for (const sep in this.targets) {
      stats[sep] = {
        target: this.targets[sep],
        actual: current[sep] || 0,
        diff: (current[sep] || 0) - this.targets[sep],
        multiplier: multipliers[sep]
      };
    }

    return stats;
  }

  /**
   * Reset history (for testing)
   */
  reset() {
    this.history = [];
  }
}

export default SeparatorBalancer;
