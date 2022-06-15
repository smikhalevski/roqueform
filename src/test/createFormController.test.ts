import {createFormController, unmountFormController} from '../main/createFormController';

describe('createFormController', () => {

  const rerenderMock = jest.fn();

  beforeEach(() => {
    rerenderMock.mockRestore();
  });

  test('creates a controller', () => {
    const controller = createFormController(rerenderMock, null, null);

    expect(controller.__form.value).toBe(undefined);
    expect(controller.__form.staged).toBe(false);
    expect(controller.__form.touched).toBe(false);
    expect(controller.__form.setValue).toBeInstanceOf(Function);
    expect(controller.__form.stageValue).toBeInstanceOf(Function);
    expect(controller.__form.commit).toBeInstanceOf(Function);
    expect(controller.__form.subscribe).toBeInstanceOf(Function);
    expect(controller.__value).toBe(undefined);
    expect(controller.__staged).toBe(false);
    expect(controller.__accessor).toBe(null);
    expect(controller.__rerender).toBe(rerenderMock);
    expect(controller.__eventBus).toBeInstanceOf(Object);
    expect(controller.__parent).toBe(null);
    expect(controller.__children).toBe(null);
    expect(controller.__mounted).toBe(true);
  });

  test('sets value to the controller', () => {
    const controller = createFormController(rerenderMock, null, null);

    controller.__form.setValue(123);

    expect(controller.__value).toBe(123);
    expect(controller.__staged).toBe(false);
    expect(controller.__form.touched).toBe(true);
  });

  test('sets value to the controller via a callback', () => {
    const controller = createFormController(rerenderMock, null, null);

    controller.__form.setValue(() => 123);

    expect(controller.__value).toBe(123);
    expect(controller.__staged).toBe(false);
  });

  test('provides the previous value to the set action', () => {
    const setStateActionMock = jest.fn();

    const controller = createFormController(rerenderMock, null, null);

    controller.__form.setValue(123);
    controller.__form.setValue(setStateActionMock);

    expect(setStateActionMock).toHaveBeenCalledTimes(1);
    expect(setStateActionMock).toHaveBeenNthCalledWith(1, 123);
  });

  test('creates a controller with a parent', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    expect(controller.__parent).toBe(parentController);
  });

  test('creates a controller with a value derived from a parent', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, {
      get: (parentValue) => parentValue?.aaa,
      set: (parentValue, value) => ({...parentValue, aaa: value}),
    });

    controller.__form.setValue(222);

    expect(parentController.__value).toEqual({aaa: 222});
    expect(parentController.__form.value).toEqual({aaa: 222});
    expect(parentController.__form.touched).toBe(false);
    expect(rerenderMock1).not.toHaveBeenCalled();

    expect(controller.__value).toBe(222);
    expect(controller.__form.value).toBe(222);
    expect(controller.__form.touched).toBe(true);
    expect(rerenderMock2).toHaveBeenCalledTimes(1);
  });

  test('propagates value to the parent controller', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    controller.__form.setValue(123);

    expect(parentController.__value).toBe(123);
    expect(parentController.__form.value).toBe(123);
    expect(parentController.__form.touched).toBe(false);
    expect(rerenderMock1).not.toHaveBeenCalled();

    expect(controller.__value).toBe(123);
    expect(controller.__form.value).toBe(123);
    expect(controller.__form.touched).toBe(true);
    expect(rerenderMock2).toHaveBeenCalledTimes(1);
  });

  test('propagates value to the child controller', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    parentController.__form.setValue(123);

    expect(parentController.__value).toBe(123);
    expect(parentController.__form.value).toBe(123);
    expect(parentController.__form.touched).toBe(true);
    expect(rerenderMock1).toHaveBeenCalledTimes(1);

    expect(controller.__value).toBe(123);
    expect(controller.__form.value).toBe(123);
    expect(controller.__form.touched).toBe(false);
    expect(rerenderMock2).not.toHaveBeenCalled();
  });

  test('staged changes are not propagated to the parent controller', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    controller.__form.stageValue(123);

    expect(parentController.__value).toBe(undefined);
    expect(controller.__value).toBe(123);
    expect(controller.__staged).toBe(true);

    expect(rerenderMock1).toHaveBeenCalledTimes(0);
    expect(rerenderMock2).toHaveBeenCalledTimes(1);
  });

  test('staged changes are propagated to children', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    parentController.__form.stageValue(123);

    expect(parentController.__value).toBe(123);
    expect(parentController.__staged).toBe(true);
    expect(controller.__value).toBe(123);

    expect(rerenderMock1).toHaveBeenCalledTimes(1);
    expect(rerenderMock2).toHaveBeenCalledTimes(0);
  });
});

describe('unmountFormController', () => {

  test('removes parent', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    unmountFormController(controller);

    expect(controller.__parent).toBe(null);
    expect(controller.__children).toBe(null);

    parentController.__form.setValue(123);

    expect(controller.__value).toBe(undefined);
    expect(rerenderMock1).toHaveBeenCalledTimes(1);
    expect(rerenderMock2).toHaveBeenCalledTimes(0);
  });

  test('unmounts children', () => {
    const rerenderMock1 = jest.fn();
    const rerenderMock2 = jest.fn();

    const parentController = createFormController(rerenderMock1, null, null);
    const controller = createFormController(rerenderMock2, parentController.__form, null);

    unmountFormController(parentController);

    expect(parentController.__parent).toBe(null);
    expect(parentController.__children).toBe(null);

    controller.__form.setValue(123);

    expect(parentController.__value).toBe(undefined);
    expect(controller.__value).toBe(undefined);
    expect(rerenderMock1).toHaveBeenCalledTimes(0);
    expect(rerenderMock2).toHaveBeenCalledTimes(0);
  });
});
