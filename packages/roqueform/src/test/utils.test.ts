import { callAll, callOrGet } from '../main';

describe('callOrGet', () => {
  test('returns non function value as is', () => {
    const obj = {};

    expect(callOrGet(123)).toBe(123);
    expect(callOrGet(null)).toBe(null);
    expect(callOrGet(obj)).toBe(obj);
  });

  test('returns the function call result', () => {
    expect(callOrGet(() => 123)).toBe(123);
  });

  test('passes arguments to a function', () => {
    expect(callOrGet((arg1, arg2) => arg1 + arg2, 123, 456)).toBe(579);
  });
});

describe('callAll', () => {
  test('calls all callbacks with the same set of arguments', () => {
    const cbMock1 = jest.fn();
    const cbMock2 = jest.fn();
    const cbMock3 = jest.fn();

    callAll([cbMock1, cbMock2, cbMock3], 'foo', 'bar');

    expect(cbMock1).toHaveBeenCalledTimes(1);
    expect(cbMock2).toHaveBeenCalledTimes(1);
    expect(cbMock3).toHaveBeenCalledTimes(1);

    expect(cbMock1).toHaveBeenNthCalledWith(1, 'foo', 'bar');
    expect(cbMock2).toHaveBeenNthCalledWith(1, 'foo', 'bar');
    expect(cbMock3).toHaveBeenNthCalledWith(1, 'foo', 'bar');
  });

  test('throws the first captured error', () => {
    const cbMock1 = jest.fn(() => {});
    const cbMock2 = jest.fn(() => {
      throw new Error('expected2');
    });
    const cbMock3 = jest.fn(() => {
      throw new Error('expected3');
    });

    expect(() => callAll([cbMock1, cbMock2, cbMock3])).toThrow(new Error('expected2'));
    expect(cbMock1).toHaveBeenCalledTimes(1);
    expect(cbMock2).toHaveBeenCalledTimes(1);
    expect(cbMock3).toHaveBeenCalledTimes(1);
  });

  test('does not call the same callback twice', () => {
    const cbMock1 = jest.fn(() => {});

    callAll([cbMock1, cbMock1]);
    expect(cbMock1).toHaveBeenCalledTimes(1);
  });
});
