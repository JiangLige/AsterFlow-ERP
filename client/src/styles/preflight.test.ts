import { readdirSync, readFileSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = resolve(process.cwd(), 'src');

function collectFiles(directory: string, extension: '.tsx' | '.scss'): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return collectFiles(path, extension);
    }

    return extname(entry.name) === extension ? [path] : [];
  });
}

const sources = [
  ...collectFiles(join(sourceRoot, 'pages'), '.tsx'),
  ...collectFiles(join(sourceRoot, 'components'), '.tsx'),
  ...collectFiles(join(sourceRoot, 'styles'), '.scss'),
];

function matchingLocations(path: string, pattern: RegExp): string[] {
  return readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .flatMap((line, index) => {
      const match = line.match(pattern);
      return match
        ? [`${relative(sourceRoot, path).replaceAll('\\', '/')}:${index + 1}: ${match[0]}`]
        : [];
    });
}

describe('Carbon redesign static pre-flight', () => {
  it('contains no retired warm-theme color tokens', () => {
    const violations = sources.flatMap((path) =>
      matchingLocations(path, /#f7f3ec|#062849|#ee5a32/i),
    );

    expect(violations).toEqual([]);
  });

  it('contains no migrated business-use Tabler icons', () => {
    const violations = sources
      .filter((path) => basename(path) !== 'BrandMark.tsx')
      .flatMap((path) =>
        matchingLocations(
          path,
          /Icon(AlertTriangle|ArrowRight|ArrowsExchange|BuildingWarehouse|ClipboardCheck|Refresh|ShoppingCart)/,
        ),
      );

    expect(violations).toEqual([]);
  });

  it('contains no inline style objects in migrated UI', () => {
    const violations = sources.flatMap((path) => matchingLocations(path, /style=\{\{/));

    expect(violations).toEqual([]);
  });

  it('contains no em or en dash characters', () => {
    const violations = sources.flatMap((path) => matchingLocations(path, /[—–]/));

    expect(violations).toEqual([]);
  });
});
