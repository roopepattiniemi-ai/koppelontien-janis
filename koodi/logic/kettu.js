// Harvinainen ajettava kettu. Sama siemen antaa saman vastauksen isännälle ja vieraalle.
import { mulberry32 } from './rng.js';

export const KETTU_OSUUS = 0.175;

export function kettuMukana(seed) {
  return mulberry32(seed >>> 0)() < KETTU_OSUUS;
}
