type SupabaseErrorLike = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

export function getSupabaseErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const maybe = error as SupabaseErrorLike;
    if (maybe.message) {
      const parts = [maybe.message];
      if (maybe.code) parts.push(`code: ${maybe.code}`);
      if (maybe.details) parts.push(maybe.details);
      if (maybe.hint) parts.push(`hint: ${maybe.hint}`);
      return parts.join(' | ');
    }
  }

  return fallback;
}
