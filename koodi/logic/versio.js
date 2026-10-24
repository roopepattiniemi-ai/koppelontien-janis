// Pelin versio tulee package.jsonista. Päivä ja commit täydentävät aloitusruudun tekstin.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
export const VERSIO = pkg.version;
export const PAIVA = '24.10.2026';

function lyhyt(s) {
  const t = String(s || '').trim();
  return /^[0-9a-f]{7,40}$/i.test(t) ? t.slice(0, 7).toLowerCase() : '';
}

export function lueCommit(env = process.env) {
  const ymp = lyhyt(env.RENDER_GIT_COMMIT || env.GIT_COMMIT || '');
  if (ymp) return ymp;
  try {
    return lyhyt(execSync('git rev-parse --short=7 HEAD', { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  } catch {
    return '';
  }
}

export function versioTeksti(commit = '') {
  const c = lyhyt(commit);
  return `v${VERSIO} – ${PAIVA}${c ? ' · ' + c : ''}`;
}

export function versioVastaus(env = process.env) {
  const commit = lueCommit(env);
  return { versio: VERSIO, paiva: PAIVA, commit, teksti: versioTeksti(commit) };
}
