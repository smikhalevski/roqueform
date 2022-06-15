import {createFormController} from '../main/createFormController';
import {EventBus} from '@smikhalevski/event-bus';

describe('createFormController', () => {

  const rerenderMock = jest.fn();

  beforeEach(() => {
    rerenderMock.mockRestore();
  });

  test('creates a new controller', () => {
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
    expect(controller.__eventBus).toBeInstanceOf(EventBus);
    expect(controller.__parent).toBe(null);
    expect(controller.__children).toBe(null);
    expect(controller.__mounted).toBe(true);
  });

  // test('creates a form object with an upstream', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController(rerenderMock1);
  //   const controller = createFormController(rerenderMock2, upstream);
  //
  //   controller.__setValue(123);
  //
  //   expect(controller.__upstream).toBe(upstream);
  // });
  //
  // test('creates a form object with a value derived from an upstream', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController<any>(rerenderMock1);
  //   const controller = createFormController<any>(rerenderMock2, upstream, {
  //     get: (upstream) => upstream?.foo,
  //     set: (upstream, value) => ({...upstream, foo: value}),
  //   });
  //
  //   controller.__setValue(123);
  //
  //   expect(upstream.value).toEqual({foo: 123});
  //   expect(controller.__value).toEqual(123);
  // });
  //
  // test('sets value to the form object', () => {
  //   const controller = createFormController(rerenderMock);
  //
  //   controller.__setValue(123);
  //
  //   expect(controller.__value).toBe(123);
  //   expect(controller.__staged).toBe(false);
  // });
  //
  // test('sets value to the form via a callback', () => {
  //   const controller = createFormController(rerenderMock);
  //
  //   controller.__setValue(() => 123);
  //
  //   expect(controller.__value).toBe(123);
  //   expect(controller.__staged).toBe(false);
  // });
  //
  // test('provides the previous value to the set action', () => {
  //   const setStateActionMock = jest.fn();
  //
  //   const controller = createFormController(rerenderMock);
  //
  //   controller.__setValue(123);
  //   controller.__setValue(setStateActionMock);
  //
  //   expect(setStateActionMock).toHaveBeenCalledTimes(1);
  //   expect(setStateActionMock).toHaveBeenNthCalledWith(1, 123);
  // });
  //
  // test('propagates value upstream', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController(rerenderMock1);
  //   const controller = createFormController(rerenderMock2, upstream);
  //
  //   controller.__setValue(123);
  //
  //   expect(rerenderMock1).toHaveBeenCalledTimes(1);
  //   expect(rerenderMock2).toHaveBeenCalledTimes(1);
  // });
  //
  // test('does not notify transient form objects', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController(rerenderMock1, undefined, undefined, true);
  //   const controller = createFormController(rerenderMock2, upstream);
  //
  //   controller.__setValue(123);
  //
  //   expect(rerenderMock1).toHaveBeenCalledTimes(0);
  //   expect(rerenderMock2).toHaveBeenCalledTimes(1);
  // });
  //
  // test('detaches from the upstream', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController(rerenderMock1);
  //   const controller = createFormController(rerenderMock2, upstream);
  //
  //   controller.__detach();
  //
  //   upstream.setValue(123)
  //
  //   expect(rerenderMock1).toHaveBeenCalledTimes(1);
  //   expect(rerenderMock2).toHaveBeenCalledTimes(0);
  // });
  //
  // test('staged changes are not propagated to the upstream', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController(rerenderMock1);
  //   const controller = createFormController(rerenderMock2, upstream);
  //
  //   controller.__stageValue(123);
  //
  //   expect(upstream.value).toBe(undefined);
  //   expect(controller.__value).toBe(123);
  //   expect(controller.__staged).toBe(true);
  //
  //   expect(rerenderMock1).toHaveBeenCalledTimes(0);
  //   expect(rerenderMock2).toHaveBeenCalledTimes(1);
  // });
  //
  // test('staged changes are propagated to the downstream', () => {
  //   const rerenderMock1 = jest.fn();
  //   const rerenderMock2 = jest.fn();
  //
  //   const upstream = createFormController(rerenderMock1);
  //   const controller = createFormController(rerenderMock2, upstream);
  //
  //   upstream.stageValue(123);
  //
  //   expect(upstream.value).toBe(123);
  //   expect(upstream.staged).toBe(true);
  //   expect(controller.__value).toBe(123);
  //
  //   expect(rerenderMock1).toHaveBeenCalledTimes(1);
  //   expect(rerenderMock2).toHaveBeenCalledTimes(1);
  // });
});
