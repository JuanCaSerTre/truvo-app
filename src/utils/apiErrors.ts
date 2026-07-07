export class ApiServiceError extends Error {
  constructor(
    message = 'The request could not be completed.',
    public readonly code = 'api_request_failed',
  ) {
    super(message);
    this.name = 'ApiServiceError';
  }
}

export const throwApiServiceError = (error: unknown, fallback = 'The request could not be completed.'): never => {
  if (error instanceof ApiServiceError) throw error;
  const code =
    error && typeof error === 'object' && 'code' in error && typeof (error as { code?: unknown }).code === 'string'
      ? (error as { code: string }).code
      : 'api_request_failed';
  throw new ApiServiceError(fallback, code);
};

export const logApiWarning = (message: string, error: unknown) => {
  const details =
    error && typeof error === 'object'
      ? {
          name: 'name' in error && typeof (error as { name?: unknown }).name === 'string' ? (error as { name: string }).name : undefined,
          code: 'code' in error && typeof (error as { code?: unknown }).code === 'string' ? (error as { code: string }).code : undefined,
          status: 'status' in error && typeof (error as { status?: unknown }).status === 'number' ? (error as { status: number }).status : undefined,
        }
      : undefined;

  console.warn(message, details);
};

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object');

export function assertApiRecord(value: unknown, entity: string): asserts value is Record<string, unknown> {
  if (!isRecord(value)) throw new ApiServiceError(`Invalid ${entity} response.`, 'invalid_api_response');
}

export function assertStringField(value: Record<string, unknown>, field: string, entity: string) {
  if (typeof value[field] !== 'string') throw new ApiServiceError(`Invalid ${entity} response.`, 'invalid_api_response');
}

export function assertBooleanField(value: Record<string, unknown>, field: string, entity: string) {
  if (typeof value[field] !== 'boolean') throw new ApiServiceError(`Invalid ${entity} response.`, 'invalid_api_response');
}

export function assertNumberLikeField(value: Record<string, unknown>, field: string, entity: string) {
  const fieldValue = value[field];
  const numberValue = typeof fieldValue === 'number' || typeof fieldValue === 'string' ? Number(fieldValue) : NaN;
  if (!Number.isFinite(numberValue)) throw new ApiServiceError(`Invalid ${entity} response.`, 'invalid_api_response');
}
