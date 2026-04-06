export interface ConfidenceCategory {
  label: string;
  min: number;
  max: number;
  color: string;
}

export const CONFIDENCE_CATEGORIES: ConfidenceCategory[] = [
  { label: 'High', min: 90, max: 100, color: 'success' },
  { label: 'Moderate', min: 70, max: 89, color: 'warning' },
  { label: 'Review Needed', min: 0, max: 69, color: 'destructive' },
];

export function getConfidenceCategory(score: number): ConfidenceCategory {
  return CONFIDENCE_CATEGORIES.find(c => score >= c.min && score <= c.max) || CONFIDENCE_CATEGORIES[2];
}

export function getConfidenceColor(score: number): string {
  if (score >= 90) return 'text-green-400';
  if (score >= 70) return 'text-yellow-400';
  return 'text-red-400';
}

export const CONFIDENCE_REASONS = {
  FULL_SEAT_MAP: 'Seat map fully loaded and parsed',
  PARTIAL_LOAD: 'Partial page load',
  FALLBACK: 'Fallback extraction used',
  INCONSISTENT_TOTALS: 'Inconsistent total seat count vs previous runs',
  PARSER_WARNING: 'Parser warning detected',
  MISSING_SEAT_MAP: 'Missing expected seat map structure',
  BLOCKED: 'Failed or blocked page access',
  TIMEOUT: 'Page load timed out',
} as const;

export function computeConfidenceScore(params: {
  seatMapLoaded: boolean;
  totalSeatsConsistent: boolean;
  parserWarnings: number;
  extractionType: string;
  pageLoadComplete: boolean;
}): { score: number; reason: string } {
  let score = 100;
  let reason: string = CONFIDENCE_REASONS.FULL_SEAT_MAP;

  if (!params.pageLoadComplete) {
    score -= 40;
    reason = CONFIDENCE_REASONS.PARTIAL_LOAD;
  }
  if (!params.seatMapLoaded) {
    score -= 30;
    reason = CONFIDENCE_REASONS.MISSING_SEAT_MAP;
  }
  if (!params.totalSeatsConsistent) {
    score -= 15;
    reason = CONFIDENCE_REASONS.INCONSISTENT_TOTALS;
  }
  if (params.parserWarnings > 0) {
    score -= params.parserWarnings * 5;
    if (score < 70) reason = CONFIDENCE_REASONS.PARSER_WARNING;
  }
  if (params.extractionType === 'fallback') {
    score -= 20;
    reason = CONFIDENCE_REASONS.FALLBACK;
  }

  return { score: Math.max(0, Math.min(100, score)), reason };
}
