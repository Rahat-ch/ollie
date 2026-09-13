/**
 * What a thrown thing says, and the one error every caller treats
 * differently: a model that is not there at all. A rejected output is worth
 * one more attempt with the reasons; an unreachable model is not, so the
 * Coach falls to the Baseline Plan and the Summary to its template at once.
 */
export const errorMessage = (error: unknown): string => (error instanceof Error ? error.message : String(error));

/** The model could not be reached at all: no key on the server, or the route said so. Never retried. */
export class ModelUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ModelUnavailableError";
  }
}

export const isUnavailable = (error: unknown): boolean => error instanceof ModelUnavailableError;
