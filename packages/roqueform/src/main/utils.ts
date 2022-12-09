/**
 * Removes readonly flag from object properties.
 *
 * @template T The object to make writable.
 */
export type Mutable<T> = { -readonly [P in keyof T]: T[P] };
