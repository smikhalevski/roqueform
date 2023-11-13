import { naturalValueAccessor } from '../main';

describe('naturalValueAccessor', () => {
  test('does not read value from primitive values', () => {
    expect(naturalValueAccessor.get(null, 'aaa')).toBeUndefined();
    expect(naturalValueAccessor.get(undefined, 'aaa')).toBeUndefined();
    expect(naturalValueAccessor.get(111, 'toString')).toBeUndefined();
    expect(naturalValueAccessor.get('aaa', 'toString')).toBeUndefined();
    expect(naturalValueAccessor.get(true, 'toString')).toBeUndefined();
    expect(naturalValueAccessor.get(() => undefined, 'length')).toBeUndefined();
    expect(naturalValueAccessor.get(new Date(), 'now')).toBeUndefined();
    expect(naturalValueAccessor.get(new RegExp(''), 'lastIndex')).toBeUndefined();
  });

  test('reads value from an array', () => {
    expect(naturalValueAccessor.get([111], 0)).toBe(111);
  });

  test('reads value from an object', () => {
    expect(naturalValueAccessor.get({ aaa: 111 }, 'aaa')).toBe(111);
  });

  test('reads value from a Map', () => {
    expect(naturalValueAccessor.get(new Map().set('aaa', 111), 'aaa')).toBe(111);
  });

  test('reads value from a Set', () => {
    expect(naturalValueAccessor.get(new Set().add(111), 0)).toBe(111);
  });

  test('creates an object', () => {
    expect(naturalValueAccessor.set(null, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set(undefined, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set(111, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set('aaa', 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set(true, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set(() => undefined, 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set(new Date(), 'aaa', 111)).toEqual({ aaa: 111 });
    expect(naturalValueAccessor.set(new RegExp(''), 'aaa', 111)).toEqual({ aaa: 111 });
  });

  test('creates an array', () => {
    expect(naturalValueAccessor.set(null, 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set(undefined, 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set(111, 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set('aaa', 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set(true, 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set(() => undefined, 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set(new Date(), 1, 111)).toEqual([undefined, 111]);
    expect(naturalValueAccessor.set(new RegExp(''), 1, 111)).toEqual([undefined, 111]);
  });

  test('creates an object if key is not an index', () => {
    expect(naturalValueAccessor.set(null, 111.222, 111)).toEqual({ '111.222': 111 });
  });

  test('creates an object if key is a string', () => {
    expect(naturalValueAccessor.set(null, '111', 'aaa')).toEqual({ 111: 'aaa' });
  });

  test('clones an array', () => {
    const arr = [111];
    const result = naturalValueAccessor.set(arr, 0, 222);

    expect(result).toEqual([222]);
    expect(result).not.toBe(arr);
  });

  test('clones an object', () => {
    const obj = { aaa: 111 };
    const result = naturalValueAccessor.set(obj, 'aaa', 222);

    expect(result).toEqual({ aaa: 222 });
    expect(result).not.toBe(obj);
  });

  test('clones a Map', () => {
    const obj = new Map().set('aaa', 111);
    const result = naturalValueAccessor.set(obj, 'aaa', 222);

    expect(result).toEqual(new Map().set('aaa', 222));
    expect(result).not.toBe(obj);
  });

  test('clones a Set', () => {
    const obj = new Set([111]);
    const result = naturalValueAccessor.set(obj, 0, 222);

    expect(result).toEqual(new Set([222]));
    expect(result).not.toBe(obj);
  });

  test('writes value to a Set at index', () => {
    const obj = new Set([111, 222]);
    const result = naturalValueAccessor.set(obj, 1, 333);

    expect(result).toEqual(new Set([111, 333]));
    expect(result).not.toBe(obj);
  });

  test('preserves null prototype', () => {
    const obj = Object.create(null);
    obj.aaa = 111;

    const result = naturalValueAccessor.set(obj, 'bbb', 222);

    expect(result).toEqual({ aaa: 111, bbb: 222 });
    expect(result).not.toBe(obj);
    expect(Object.getPrototypeOf(result)).toBeNull();
  });
});
