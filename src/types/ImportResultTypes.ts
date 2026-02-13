export interface ImportResult {
  total: number;
  inserted: number;
  failed: number;
  errors: { row: number; reason: string }[];
}
