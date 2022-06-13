import {KeysAccessor} from '../main/KeysAccessor';

describe('KeysAccessor', () => {

  test('reads when there are no keys', () => {
    const upstreamValue = {aaa: 123};

    expect(new KeysAccessor([]).get(upstreamValue)).toBe(upstreamValue);
  });

  test('reads a key from an undefined', () => {
    expect(new KeysAccessor(['aaa']).get(undefined)).toBe(undefined);
  });

  test('reads a key from a primitive value', () => {
    expect(new KeysAccessor(['aaa']).get(123)).toBe(undefined);
  });

  test('reads a key from an object', () => {
    expect(new KeysAccessor(['aaa']).get({aaa: 123})).toBe(123);
  });

  test('reads a key from an array', () => {
    expect(new KeysAccessor([0]).get([123])).toBe(123);
  });

  test('reads a key from a Map', () => {
    expect(new KeysAccessor(['aaa']).get(new Map([['aaa', 123]]))).toBe(123);
  });

  test('reads a deep key', () => {
    expect(new KeysAccessor(['aaa', 0, 'bbb']).get({aaa: [new Map([['bbb', 123]])]})).toBe(123);
  });

  test('reads a deep key when nested object is undefined', () => {
    expect(new KeysAccessor(['aaa', 0]).get({})).toBe(undefined);
  });

  test('writes a key to an object', () => {
    const upstreamValue = {aaa: 123};
    const result = new KeysAccessor(['aaa']).set(upstreamValue, 456);

    expect(result).toEqual({aaa: 456});
    expect(upstreamValue).not.toBe(result);
  });

  test('writes a key to an array', () => {
    const upstreamValue = [123];
    const result = new KeysAccessor([0]).set(upstreamValue, 456);

    expect(result).toEqual([456]);
    expect(upstreamValue).not.toBe(result);
  });

  test('writes a key to a Map', () => {
    const upstreamValue = new Map([['aaa', 123]]);
    const result = new KeysAccessor(['aaa']).set(upstreamValue, 456);

    expect(result).toEqual(new Map([['aaa', 456]]));
    expect(upstreamValue).not.toBe(result);
  });

  test('writes a deep key', () => {
    const upstreamValue = {aaa: [new Map([['bbb', 123]])]};
    const result = new KeysAccessor(['aaa', 0, 'bbb']).set(upstreamValue, 456);

    expect(result).toEqual({aaa: [new Map([['bbb', 456]])]});
    expect(result).not.toBe(upstreamValue);
    expect(result.aaa).not.toBe(upstreamValue.aaa);
    expect(result.aaa[0]).not.toBe(upstreamValue.aaa[0]);
  });

  test('writes a deep key when nested object is undefined', () => {
    expect(new KeysAccessor(['aaa', 0]).set(undefined, 123)).toEqual({aaa: [123]});
  });
});
