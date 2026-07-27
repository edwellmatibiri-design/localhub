const SPAM_PATTERNS = [
  /best\s+best\s+best/i,
  /cheap\s+cheap\s+cheap/i,
  /click\s+here\s+now/i,
  /free\s+money/i,
];

export function detectSpam(content: string): string[] {
  return SPAM_PATTERNS.filter((pattern) => pattern.test(content)).map((pattern) => pattern.source);
}
