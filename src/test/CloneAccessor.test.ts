import {CloneAccessor} from '../main';

describe('CloneAccessor', () => {

  test('reads when there are no keys', () => {
    const parentValue = {aaa: 111};

    expect(new CloneAccessor([]).get(parentValue)).toBe(parentValue);
  });

  test('reads a key from undefined', () => {
    expect(new CloneAccessor(['aaa']).get(undefined)).toBe(undefined);
  });

  test('reads a key from null', () => {
    expect(new CloneAccessor(['aaa']).get(null)).toBe(undefined);
  });

  test('reads a key from a primitive value', () => {
    expect(new CloneAccessor(['aaa']).get(111)).toBe(undefined);
  });

  test('reads a key from an object', () => {
    expect(new CloneAccessor(['aaa']).get({aaa: 111})).toBe(111);
  });

  test('reads a key from an array', () => {
    expect(new CloneAccessor([0]).get([111])).toBe(111);
  });

  test('reads a key from a Map', () => {
    expect(new CloneAccessor(['aaa']).get(new Map([['aaa', 111]]))).toBe(111);
  });

  test('reads a deep key', () => {
    expect(new CloneAccessor(['aaa', 0, 'bbb']).get({aaa: [new Map([['bbb', 111]])]})).toBe(111);
  });

  test('reads a deep key when nested object is undefined', () => {
    expect(new CloneAccessor(['aaa', 0]).get({})).toBe(undefined);
  });

  test('writes a key to an object', () => {
    const parentValue = {aaa: 111};
    const result = new CloneAccessor(['aaa']).set(parentValue, 222);

    expect(result).toEqual({aaa: 222});
    expect(parentValue).not.toBe(result);
  });

  test('writes a key to an array', () => {
    const parentValue = [111];
    const result = new CloneAccessor([0]).set(parentValue, 222);

    expect(result).toEqual([222]);
    expect(parentValue).not.toBe(result);
  });

  test('writes a key to a Map', () => {
    const parentValue = new Map([['aaa', 111]]);
    const result = new CloneAccessor(['aaa']).set(parentValue, 222);

    expect(result).toEqual(new Map([['aaa', 222]]));
    expect(parentValue).not.toBe(result);
  });

  test('writes a deep key', () => {
    const parentValue = {aaa: [new Map([['bbb', 111]])]};
    const result = new CloneAccessor(['aaa', 0, 'bbb']).set(parentValue, 222);

    expect(result).toEqual({aaa: [new Map([['bbb', 222]])]});
    expect(result).not.toBe(parentValue);
    expect(result.aaa).not.toBe(parentValue.aaa);
    expect(result.aaa[0]).not.toBe(parentValue.aaa[0]);
  });

  test('creates Map for object key', () => {
    const key = {};

    expect(new CloneAccessor([key]).set(undefined, 111)).toEqual(new Map([[key, 111]]));
  });

  test('creates Map for null key', () => {
    expect(new CloneAccessor([null]).set(undefined, 111)).toEqual(new Map([[null, 111]]));
  });

  test('creates Map for undefined key', () => {
    expect(new CloneAccessor([undefined]).set(undefined, 111)).toEqual(new Map([[undefined, 111]]));
  });

  test('creates array', () => {
    expect(new CloneAccessor([3]).set(undefined, 111)).toEqual([undefined, undefined, undefined, 111]);
  });

  test('creates object for string key', () => {
    expect(new CloneAccessor(['aaa']).set(undefined, 111)).toEqual({aaa: 111});
  });

  test('creates object for symbol key', () => {
    const key = Symbol();

    expect(new CloneAccessor([key]).set(undefined, 111)).toEqual({[key]: 111});
  });

  test('creates a deeply nested structure', () => {
    const key1 = {};
    const key2 = Symbol();

    expect(new CloneAccessor([key1, 'aaa', 2, key2]).set(undefined, 111)).toEqual(new Map([[key1, {aaa: [undefined, undefined, {[key2]: 111}]}]]));
  });
});
