import {objectAccessor} from '../main';

describe('objectAccessor', () => {

  test('reads value from an array', () => {
    expect(objectAccessor.get([111], 0)).toBe(111);
  });

  test('reads value from an object', () => {
    expect(objectAccessor.get({aaa: 111}, 'aaa')).toBe(111);
  });

  test('clones an array on update', () => {
    const arr = [111];
    const result = objectAccessor.set(arr, 0, 222);

    expect(result).toEqual([222]);
    expect(result).not.toBe(arr);
  });

  test('clones an object on update', () => {
    const obj = {foo: 111};
    const result = objectAccessor.set(obj, 'foo', 222);

    expect(result).toEqual({foo: 222});
    expect(result).not.toBe(obj);
  });

  test('creates an array on update', () => {
    const result = objectAccessor.set(undefined, 0, 222);

    expect(result).toEqual([222]);
  });

  test('creates an object on update', () => {
    const result = objectAccessor.set(undefined, 'foo', 222);

    expect(result).toEqual({foo: 222});
  });
});
