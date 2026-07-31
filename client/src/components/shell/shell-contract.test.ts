import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/styles/globals.scss'), 'utf8');
const layout = readFileSync(resolve(process.cwd(), 'src/components/Layout.tsx'), 'utf8');

function ruleBody(selector: string) {
  const escapedSelector = selector
    .split(/\s+/)
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\s*');
  const match = styles.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`));

  expect(match, `Missing CSS rule for ${selector}`).not.toBeNull();
  return match?.[1] ?? '';
}

describe('Carbon shell style contract', () => {
  it('makes the skip-link target programmatically focusable', () => {
    expect(layout).toMatch(/<main[^>]*id="main-content"[^>]*tabIndex=\{-1\}/);
  });

  it('shows only the open mobile panel at narrow widths', () => {
    expect(styles).toMatch(/@media\s*\(max-width:\s*767px\)[\s\S]*\.aster-mobile-panel:not\(\[hidden\]\)\s*\{\s*display:\s*(?:block|grid|flex);/);
    expect(styles).toMatch(/\.aster-mobile-panel\[hidden\]\s*\{\s*display:\s*none;/);
  });

  it('contains no rejected warm palette values', () => {
    expect(styles.toLowerCase()).not.toContain('rgba(255, 253, 249, 0.72)');
    expect(styles.toLowerCase()).not.toContain('#efc9a4');
    expect(styles.toLowerCase()).not.toContain('#aaa39a');
  });

  it.each([
    '--danger', '--danger-soft', '--danger-border',
    '--success', '--success-soft', '--success-border',
    '--warning', '--warning-soft', '--warning-border',
  ])('defines the %s semantic token in :root', (token) => {
    const root = ruleBody(':root');
    expect(root).toMatch(new RegExp(`${token}:\\s*[^;]+;`));
  });

  it('limits all shell, button, and input transitions to motion properties', () => {
    const transitions = [...styles.matchAll(/transition:\s*([^;]+);/g)].map((match) => match[1]);

    expect(styles).toMatch(/button,[\s\S]{0,800}transition:\s*transform\s+160ms\s+ease;/);
    expect(styles).toMatch(/input,[\s\S]{0,800}transition:\s*transform\s+160ms\s+ease;/);

    for (const transition of transitions) {
      const properties = transition.split(',').map((part) => part.trim().split(/\s+/)[0]);

      expect(transition).toMatch(/(?:150|1[6-9]0|200)ms/);
      expect(properties.length).toBeGreaterThan(0);
      expect(properties.every((property) => ['transform', 'opacity'].includes(property))).toBe(true);
    }
  });
});
