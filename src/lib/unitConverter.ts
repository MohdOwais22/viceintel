/**
 * Unit Conversion & Global Accessibility Utility Module
 * Manages Imperial (MPH / Yards) vs Metric (KM/H / Meters) preferences and conversions.
 */

export type UnitSystem = 'imperial' | 'metric';

const STORAGE_KEY = 'gtavi_unit_preference';

/**
 * Reads stored unit preference from localStorage with fallback to 'imperial'
 */
export function getStoredUnitPreference(): UnitSystem {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'metric' || saved === 'imperial') {
        return saved;
      }
    } catch {
      // Fallback on storage errors
    }
  }
  return 'imperial';
}

/**
 * Persists unit preference to localStorage
 */
export function setStoredUnitPreference(unit: UnitSystem): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, unit);
    } catch {
      // Ignore storage write errors
    }
  }
}

/**
 * Converts top speed from MPH to KM/H if unit === 'metric'
 */
export function convertSpeed(topSpeedMph: number, unit: UnitSystem): number {
  if (unit === 'metric') {
    return Math.round(topSpeedMph * 1.60934 * 10) / 10;
  }
  return Math.round(topSpeedMph * 10) / 10;
}

/**
 * Formats top speed with appropriate unit suffix (e.g., '138.5 MPH' or '222.9 KM/H')
 */
export function formatSpeed(topSpeedMph: number, unit: UnitSystem): string {
  const converted = convertSpeed(topSpeedMph, unit);
  const unitLabel = unit === 'metric' ? 'KM/H' : 'MPH';
  return `${converted} ${unitLabel}`;
}

/**
 * Converts weapon or map distance score to metric (meters) or imperial (yards/feet)
 */
export function convertRange(rangeScore: number, unit: UnitSystem): number {
  // 1 score point ≈ 1.25 meters / 1.36 yards
  if (unit === 'metric') {
    return Math.round(rangeScore * 1.25);
  }
  return Math.round(rangeScore * 1.36);
}

/**
 * Formats range with appropriate unit suffix (e.g., '103m' or '112yd')
 */
export function formatRange(rangeScore: number, unit: UnitSystem): string {
  const val = convertRange(rangeScore, unit);
  const unitLabel = unit === 'metric' ? 'm' : 'yd';
  return `${val}${unitLabel}`;
}
