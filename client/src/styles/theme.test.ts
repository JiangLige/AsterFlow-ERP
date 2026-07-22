import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AsterFlow Carbon theme', () => {
  const source = readFileSync(resolve(__dirname, 'globals.scss'), 'utf8');

  it('loads Carbon and locks the approved visual tokens', () => {
    expect(source).toContain("@use '@carbon/react'");
    expect(source).toContain('--aster-background: #f4f4f4');
    expect(source).toContain('--aster-text: #161616');
    expect(source).toContain('--aster-accent: #0f62fe');
    expect(source).not.toMatch(/#f7f3ec|#ee5a32/i);
  });
});
