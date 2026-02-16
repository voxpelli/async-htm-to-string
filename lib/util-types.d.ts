/** Re-export MaybePromised from @voxpelli/type-helpers for local use */
export type { MaybePromised } from '@voxpelli/type-helpers';

export type IterableIteratorMaybeAsync<T> = T[] | IterableIterator<T> | AsyncIterableIterator<T>;
export type MaybeArray<T> = T | T[];
