import { naturalAccessor } from '../main';

describe('naturalAccessor', () => {
  test('does not read value from skipped values', () => {
    expect(naturalAccessor.get(null, 'aaa')).toBe(undefined);
    expect(naturalAccessor.get(undefined, 'aaa')).toBe(undefined);
    expect(naturalAccessor.get(111, 'toString')).toBe(undefined);
    expect(naturalAccessor.get('aaa', 'toString')).toBe(undefined);
    expect(naturalAccessor.get(true, 'toString')).toBe(undefined);
    expect(naturalAccessor.get(() => undefined, 'length')).toBe(undefined);
    expect(naturalAccessor.get(new Date(), 'now')).toBe(undefined);
    expect(naturalAccessor.get(new RegExp(''), 'lastIndex')).toBe(undefined);
  });

  test('reads value from an array', () => {
    expect(naturalAccessor.get([111], 0)).toBe(111);
  });

  test('reads value from an object', () => {
    expect(naturalAccessor.get({ aaa: 111 }, 'aaa')).toBe(111);
  });

  test('reads value from a Map', () => {
    expect(naturalAccessor.get(new Map().set('aaa', 111), 'aaa')).toBe(111);
  });

  test('reads value from a Set', () => {
    expect(naturalAccessor.get(new Set().add(111), 0)).toBe(111);
  });

  test('creates an object', () => {
    expect(naturalAccessor.set(null, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set(undefined, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set(111, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set('aaa', 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set(true, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set(() => undefined, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set(new Date(), 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalAccessor.set(new RegExp(''), 'aaa', 111)).toEqual({ aaa: 111 });
  });

  test('creates an array', () => {
    expect(naturalAccessor.set(null, 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set(undefined, 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set(111, 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set('aaa', 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set(true, 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set(() => undefined, 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set(new Date(), 1, 111)).toEqual([undefined, 111]);
    expect(naturalAccessor.set(new RegExp(''), 1, 111)).toEqual([undefined, 111]);
  });

  test('creates an object if key is not an index', () => {
    expect(naturalAccessor.set(null, 111.222, 111)).toEqual({ '111.222': 111 });
  });

  test('creates an object if key is a string', () => {
    expect(naturalAccessor.set(null, '111', 'aaa')).toEqual({ 111: 'aaa' });
  });

  test('clones an array', () => {
    const arr = [111];
    const result = naturalAccessor.set(arr, 0, 222);

    expect(result).toEqual([222]);
    expect(result).not.toBe(arr);
  });

  test('clones an object', () => {
    const obj = { aaa: 111 };
    const result = naturalAccessor.set(obj, 'aaa', 222);

    expect(result).toEqual({ aaa: 222 });
    expect(result).not.toBe(obj);
  });

  test('clones a Map', () => {
    const obj = new Map().set('aaa', 111);
    const result = naturalAccessor.set(obj, 'aaa', 222);

    expect(result).toEqual(new Map().set('aaa', 222));
    expect(result).not.toBe(obj);
  });

  test('clones a Set', () => {
    const obj = new Set([111]);
    const result = naturalAccessor.set(obj, 0, 222);

    expect(result).toEqual(new Set([222]));
    expect(result).not.toBe(obj);
  });

  test('writes value to a Set at index', () => {
    const obj = new Set([111, 222]);
    const result = naturalAccessor.set(obj, 1, 333);

    expect(result).toEqual(new Set([111, 333]));
    expect(result).not.toBe(obj);
  });

  test('preserves null prototype', () => {
    const obj = Object.create(null);
    obj.aaa = 111;

    const result = naturalAccessor.set(obj, 'bbb', 222);

    expect(result).toEqual({ aaa: 111, bbb: 222 });
    expect(result).not.toBe(obj);
    expect(Object.getPrototypeOf(result)).toBe(null);
  });
});
