import {CloneAccessor} from '../main';

describe('CloneAccessor', () => {

  test('reads when there are no keys', () => {
    const parentValue = {aaa: 123};

    expect(new CloneAccessor([]).get(parentValue)).toBe(parentValue);
  });

  test('reads a key from undefined', () => {
    expect(new CloneAccessor(['aaa']).get(undefined)).toBe(undefined);
  });

  test('reads a key from null', () => {
    expect(new CloneAccessor(['aaa']).get(null)).toBe(undefined);
  });

  test('reads a key from a primitive value', () => {
    expect(new CloneAccessor(['aaa']).get(123)).toBe(undefined);
  });

  test('reads a key from an object', () => {
    expect(new CloneAccessor(['aaa']).get({aaa: 123})).toBe(123);
  });

  test('reads a key from an array', () => {
    expect(new CloneAccessor([0]).get([123])).toBe(123);
  });

  test('reads a key from a Map', () => {
    expect(new CloneAccessor(['aaa']).get(new Map([['aaa', 123]]))).toBe(123);
  });

  test('reads a deep key', () => {
    expect(new CloneAccessor(['aaa', 0, 'bbb']).get({aaa: [new Map([['bbb', 123]])]})).toBe(123);
  });

  test('reads a deep key when nested object is undefined', () => {
    expect(new CloneAccessor(['aaa', 0]).get({})).toBe(undefined);
  });

  test('writes a key to an object', () => {
    const parentValue = {aaa: 123};
    const result = new CloneAccessor(['aaa']).set(parentValue, 456);

    expect(result).toEqual({aaa: 456});
    expect(parentValue).not.toBe(result);
  });

  test('writes a key to an array', () => {
    const parentValue = [123];
    const result = new CloneAccessor([0]).set(parentValue, 456);

    expect(result).toEqual([456]);
    expect(parentValue).not.toBe(result);
  });

  test('writes a key to a Map', () => {
    const parentValue = new Map([['aaa', 123]]);
    const result = new CloneAccessor(['aaa']).set(parentValue, 456);

    expect(result).toEqual(new Map([['aaa', 456]]));
    expect(parentValue).not.toBe(result);
  });

  test('writes a deep key', () => {
    const parentValue = {aaa: [new Map([['bbb', 123]])]};
    const result = new CloneAccessor(['aaa', 0, 'bbb']).set(parentValue, 456);

    expect(result).toEqual({aaa: [new Map([['bbb', 456]])]});
    expect(result).not.toBe(parentValue);
    expect(result.aaa).not.toBe(parentValue.aaa);
    expect(result.aaa[0]).not.toBe(parentValue.aaa[0]);
  });

  test('creates Map for object key', () => {
    const key = {};
    expect(new CloneAccessor([key]).set(undefined, 123)).toEqual(new Map([[key, 123]]));
  });

  test('creates Map for null key', () => {
    expect(new CloneAccessor([null]).set(undefined, 123)).toEqual(new Map([[null, 123]]));
  });

  test('creates Map for undefined key', () => {
    expect(new CloneAccessor([undefined]).set(undefined, 123)).toEqual(new Map([[undefined, 123]]));
  });

  test('creates array', () => {
    expect(new CloneAccessor([3]).set(undefined, 123)).toEqual([undefined, undefined, undefined, 123]);
  });

  test('creates object for string key', () => {
    expect(new CloneAccessor(['aaa']).set(undefined, 123)).toEqual({aaa: 123});
  });

  test('creates object for symbol key', () => {
    const key = Symbol();
    expect(new CloneAccessor([key]).set(undefined, 123)).toEqual({[key]: 123});
  });

  test('creates a deeply nested structure', () => {
    const key1 = {};
    const key2 = Symbol();
    expect(new CloneAccessor([key1, 'aaa', 2, key2]).set(undefined, 123)).toEqual(new Map([[key1, {aaa: [undefined, undefined, {[key2]: 123}]}]]));
  });
});
