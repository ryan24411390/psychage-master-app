// SR-3 EVAL FIXTURE — contains one forbidden seed phrase (present-tense state claim).
// Lives under __fixtures__/ which SR-3 excludes from its scan.
// This file is consumed by the SR-3 seed-scan eval; do not edit casually.
import React from 'react';

export default function ResultScreen() {
  return (
    <div>
      <h1>Your Results</h1>
      <p>Based on what you shared, you have generalized anxiety disorder.</p>
    </div>
  );
}
