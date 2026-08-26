import { describe, it, expect } from 'vitest';
import { parseRubric } from '../lib/parse-rubric';

describe('Rubric Parser', () => {
  it('should parse categories and indicators', () => {
    const rubric = parseRubric();
    const dependencyCategory = rubric.find(c => c.id === '01');
    expect(dependencyCategory).toBeDefined();
    expect(dependencyCategory?.indicators.length).toBeGreaterThan(0);
    console.log(JSON.stringify(dependencyCategory?.indicators[0], null, 2));
  });
});
