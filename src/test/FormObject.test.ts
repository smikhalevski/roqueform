import {FormObject} from '../main';

describe('FormObject', () => {

  const listenerMock = jest.fn();

  beforeEach(() => {
    listenerMock.mockRestore();
  });

  test('creates a form object', () => {
    const formObject = new FormObject(listenerMock);

    expect(formObject.value).toBe(undefined);
    expect(formObject.upstream).toBe(undefined);
    expect(formObject.staged).toBe(false);
  });

  test('creates a form object with an upstream', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject(listenerMock1);
    const formObject = new FormObject(listenerMock2, upstream);

    formObject.setValue(123);

    expect(formObject.upstream).toBe(upstream);
  });

  test('creates a form object with a value derived from an upstream', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject<any>(listenerMock1);
    const formObject = new FormObject<any>(listenerMock2, upstream, {
      get: (upstream) => upstream?.foo,
      set: (upstream, value) => ({...upstream, foo: value}),
    });

    formObject.setValue(123);

    expect(upstream.value).toEqual({foo: 123});
    expect(formObject.value).toEqual(123);
  });

  test('sets value to the form object', () => {
    const formObject = new FormObject(listenerMock);

    formObject.setValue(123);

    expect(formObject.value).toBe(123);
    expect(formObject.staged).toBe(false);
  });

  test('sets value to the form via a callback', () => {
    const formObject = new FormObject(listenerMock);

    formObject.setValue(() => 123);

    expect(formObject.value).toBe(123);
    expect(formObject.staged).toBe(false);
  });

  test('provides the previous value to the set action', () => {
    const setStateActionMock = jest.fn();

    const formObject = new FormObject(listenerMock);

    formObject.setValue(123);
    formObject.setValue(setStateActionMock);

    expect(setStateActionMock).toHaveBeenCalledTimes(1);
    expect(setStateActionMock).toHaveBeenNthCalledWith(1, 123);
  });

  test('propagates value upstream', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject(listenerMock1);
    const formObject = new FormObject(listenerMock2, upstream);

    formObject.setValue(123);

    expect(listenerMock1).toHaveBeenCalledTimes(1);
    expect(listenerMock2).toHaveBeenCalledTimes(1);
  });

  test('does not notify transient form objects', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject(listenerMock1, undefined, undefined, true);
    const formObject = new FormObject(listenerMock2, upstream);

    formObject.setValue(123);

    expect(listenerMock1).toHaveBeenCalledTimes(0);
    expect(listenerMock2).toHaveBeenCalledTimes(1);
  });

  test('detaches from the upstream', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject(listenerMock1);
    const formObject = new FormObject(listenerMock2, upstream);

    formObject.detach();

    upstream.setValue(123)

    expect(listenerMock1).toHaveBeenCalledTimes(1);
    expect(listenerMock2).toHaveBeenCalledTimes(0);
  });

  test('staged changes are not propagated to the upstream', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject(listenerMock1);
    const formObject = new FormObject(listenerMock2, upstream);

    formObject.stageValue(123);

    expect(upstream.value).toBe(undefined);
    expect(formObject.value).toBe(123);
    expect(formObject.staged).toBe(true);

    expect(listenerMock1).toHaveBeenCalledTimes(0);
    expect(listenerMock2).toHaveBeenCalledTimes(1);
  });

  test('staged changes are propagated to the downstream', () => {
    const listenerMock1 = jest.fn();
    const listenerMock2 = jest.fn();

    const upstream = new FormObject(listenerMock1);
    const formObject = new FormObject(listenerMock2, upstream);

    upstream.stageValue(123);

    expect(upstream.value).toBe(123);
    expect(upstream.staged).toBe(true);
    expect(formObject.value).toBe(123);

    expect(listenerMock1).toHaveBeenCalledTimes(1);
    expect(listenerMock2).toHaveBeenCalledTimes(1);
  });
});
