/**
 * Removes readonly flag from object properties.
 *
 * @template T The object to make writable.
 */
export type Writable<T> = { -readonly [P in keyof T]: T[P] };
