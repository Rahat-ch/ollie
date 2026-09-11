/**
 * The Generation seam: the four operations, the Coach's output schema, and
 * the fake. The real adapters are imported by their own paths, never from
 * here, so nothing that runs on the fake pulls in a network client.
 */
export type * from "./types";
export type { CoachOutputParse } from "./coach-schema";
export { CoachOutputSchema, parseCoachOutput } from "./coach-schema";
export { fakeGeneration } from "./fake";
