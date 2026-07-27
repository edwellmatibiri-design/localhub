export type ChangeLogEntry = {
  changeId: string;
  path: string;
  previousValue: string;
  updatedValue: string;
  appliedAtIso: string;
};

export function rollbackChange(entry: ChangeLogEntry): { path: string; restoredValue: string } {
  return {
    path: entry.path,
    restoredValue: entry.previousValue,
  };
}
