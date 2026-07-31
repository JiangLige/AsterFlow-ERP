import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('AsterFlow Carbon theme', () => {
  const source = readFileSync(resolve(__dirname, 'globals.scss'), 'utf8');

  it('loads Carbon and locks the approved visual tokens', () => {
    expect(source).toContain("@use '@carbon/react'");
    expect(source).toContain('--aster-background: #f4f4f4');
    expect(source).toContain('--aster-layer: #ffffff');
    expect(source).toContain('--aster-text: #161616');
    expect(source).toContain('--aster-text-secondary: #525252');
    expect(source).toContain('--aster-border: #c6c6c6');
    expect(source).toContain('--aster-accent: #0f62fe');
    expect(source).not.toMatch(/#f7f3ec|#062849|#ee5a32/i);
  });

  it('gives the root application a dynamic viewport minimum height', () => {
    expect(source).toMatch(
      /html,\s*body,\s*#__next\s*{\s*min-height:\s*100dvh;\s*}/,
    );
  });

  it('keeps operations filters on one desktop row and one mobile column', () => {
    expect(source).toMatch(
      /\.operations-list \.aster-toolbar\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*minmax\(20rem,\s*1fr\)\s+minmax\(11rem,\s*14rem\)\s+auto;/,
    );
    expect(source).toMatch(
      /@media\s*\(max-width:\s*767px\)[\s\S]*\.operations-list \.aster-toolbar\s*\{[^}]*grid-template-columns:\s*1fr;/,
    );
  });

  it('caps authenticated page headings at 2rem', () => {
    expect(source).toMatch(/\.aster-page-header h1\s*\{[^}]*font-size:\s*2rem;/);
  });
});
