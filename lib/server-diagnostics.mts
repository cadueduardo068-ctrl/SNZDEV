// Never log SQL, parameters, request headers, email addresses or arbitrary error messages.
export function databaseFailure(error: unknown): string {
  let current = error;
  const seen = new Set<unknown>();
  while (current instanceof Error && !seen.has(current)) {
    seen.add(current);
    if (/no such table/i.test(current.message)) return 'D1_TABLE_MISSING';
    if (/no such column|has no column/i.test(current.message)) return 'D1_COLUMN_MISSING';
    if (/binding.*DB.*unavailable/i.test(current.message)) return 'D1_BINDING_MISSING';
    current = current.cause;
  }
  return 'D1_QUERY_FAILED';
}

export async function databaseOperation<T>(operation: string, run: () => PromiseLike<T>): Promise<T> {
  try { return await run(); }
  catch (error) {
    console.error('[snz:database]', JSON.stringify({operation, code: databaseFailure(error), incident: crypto.randomUUID()}));
    throw error;
  }
}
