export type IterableIteratorMaybeAsync<T> = T[] | IterableIterator<T> | AsyncIterableIterator<T>;
export type MaybeArray<T> = T | T[];
export type MaybePromised<T> = T | Promise<T>;
