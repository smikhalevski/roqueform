import { ElementValueAccessor, uncontrolledPlugin } from '../main';
import { applyPlugins, createField, objectAccessor } from 'roqueform';
import { fireEvent } from '@testing-library/dom';

describe('uncontrolledPlugin', () => {
  let element: HTMLInputElement;

  beforeEach(() => {
    element = document.body.appendChild(document.createElement('input'));
  });

  afterEach(() => {
    element.remove();
  });

  test('updates field value on input change', () => {
    const listenerMock = jest.fn();
    const field = createField({ foo: 0 }, uncontrolledPlugin());

    element.type = 'number';

    field.subscribe(listenerMock);
    field.at('foo').refCallback(element);

    fireEvent.change(element, { target: { value: '111' } });

    expect(listenerMock).toHaveBeenCalledTimes(1);
    expect(field.value).toEqual({ foo: 111 });
  });

  test('updates input value on field change', () => {
    const field = createField({ foo: 0 }, uncontrolledPlugin());

    field.at('foo').refCallback(element);
    field.at('foo').setValue(111);

    expect(element.value).toBe('111');
  });

  test('sets the initial value to the element', () => {
    const field = createField({ foo: 111 }, uncontrolledPlugin());

    element.type = 'number';

    field.at('foo').refCallback(element);

    expect(element.value).toBe('111');
  });

  test('invokes refCallback from the preceding plugin', () => {
    const refCallbackMock = jest.fn();
    const pluginMock = jest.fn(field => {
      field.refCallback = refCallbackMock;
    });

    const field = createField({ foo: 111 }, applyPlugins(pluginMock, uncontrolledPlugin()));

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, objectAccessor, expect.any(Function));

    expect(refCallbackMock).not.toHaveBeenCalled();

    field.at('foo').refCallback(element);

    expect(refCallbackMock).toHaveBeenCalledTimes(1);
    expect(refCallbackMock).toHaveBeenNthCalledWith(1, element);
  });

  test('does not invoke preceding plugin if an additional element is added', () => {
    const refCallbackMock = jest.fn();
    const plugin = (field: any) => {
      field.refCallback = refCallbackMock;
    };

    const element1 = document.body.appendChild(document.createElement('input'));
    const element2 = document.body.appendChild(document.createElement('input'));

    const field = createField({ foo: 111 }, applyPlugins(plugin, uncontrolledPlugin()));

    field.at('foo').refCallback(element1);
    field.at('foo').refCallback(element2);

    expect(refCallbackMock).toHaveBeenCalledTimes(1);
    expect(refCallbackMock).toHaveBeenNthCalledWith(1, element1);
  });

  test('invokes preceding plugin if the head element has changed', done => {
    const refCallbackMock = jest.fn();
    const plugin = (field: any) => {
      field.refCallback = refCallbackMock;
    };

    const element1 = document.body.appendChild(document.createElement('input'));
    const element2 = document.body.appendChild(document.createElement('textarea'));

    const field = createField({ foo: 111 }, applyPlugins(plugin, uncontrolledPlugin()));

    field.at('foo').refCallback(element1);
    field.at('foo').refCallback(element2);

    expect(refCallbackMock).toHaveBeenCalledTimes(1);
    expect(refCallbackMock).toHaveBeenNthCalledWith(1, element1);

    element1.remove();

    queueMicrotask(() => {
      expect(refCallbackMock).toHaveBeenCalledTimes(2);
      expect(refCallbackMock).toHaveBeenNthCalledWith(2, element2);
      done();
    });
  });

  test('invokes preceding plugin if the head element was removed', done => {
    const refCallbackMock = jest.fn();
    const plugin = (field: any) => {
      field.refCallback = refCallbackMock;
    };

    const field = createField({ foo: 111 }, applyPlugins(plugin, uncontrolledPlugin()));

    field.at('foo').refCallback(element);

    element.remove();

    queueMicrotask(() => {
      expect(refCallbackMock).toHaveBeenCalledTimes(2);
      expect(refCallbackMock).toHaveBeenNthCalledWith(1, element);
      expect(refCallbackMock).toHaveBeenNthCalledWith(2, null);
      done();
    });
  });

  test('null refs are not propagated to preceding plugin', () => {
    const refCallbackMock = jest.fn();
    const plugin = (field: any) => {
      field.refCallback = refCallbackMock;
    };

    const field = createField({ foo: 111 }, applyPlugins(plugin, uncontrolledPlugin()));

    field.at('foo').refCallback(null);

    expect(refCallbackMock).not.toHaveBeenCalled();
  });

  test('does not call setValue if the same value multiple times', () => {
    const accessorMock: ElementValueAccessor = {
      get: jest.fn(() => 'xxx'),
      set: jest.fn(),
    };

    const field = createField('aaa', uncontrolledPlugin(accessorMock));

    const setValueMock = (field.setValue = jest.fn(field.setValue));

    field.refCallback(element);

    expect(accessorMock.set).toHaveBeenCalledTimes(1);
    expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element], 'aaa');
    expect(accessorMock.get).not.toHaveBeenCalled();
    expect(setValueMock).not.toHaveBeenCalled();

    fireEvent.change(element, { target: { value: 'bbb' } });
    fireEvent.input(element, { target: { value: 'bbb' } });

    expect(setValueMock).toHaveBeenCalledTimes(1);
    expect(setValueMock).toHaveBeenNthCalledWith(1, 'xxx');

    expect(accessorMock.set).toHaveBeenCalledTimes(2);
    expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element], 'xxx');
  });

  test('uses accessor to set values to the element', () => {
    const accessorMock: ElementValueAccessor = {
      get: () => undefined,
      set: jest.fn(),
    };

    const field = createField({ foo: 'aaa' }, uncontrolledPlugin(accessorMock));

    field.at('foo').refCallback(element);

    expect(accessorMock.set).toHaveBeenCalledTimes(1);
    expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element], 'aaa');

    field.at('foo').setValue('bbb');

    expect(accessorMock.set).toHaveBeenCalledTimes(2);
    expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element], 'bbb');
  });

  test('does not call set accessor if there are no referenced elements', () => {
    const accessorMock: ElementValueAccessor = {
      get: () => undefined,
      set: jest.fn(),
    };

    const field = createField({ foo: 'aaa' }, uncontrolledPlugin(accessorMock));

    field.at('foo').setValue('bbb');

    expect(accessorMock.set).not.toHaveBeenCalled();
  });

  test('multiple elements are passed to set accessor', () => {
    const accessorMock: ElementValueAccessor = {
      get: () => 'xxx',
      set: jest.fn(),
    };

    const element1 = document.body.appendChild(document.createElement('input'));
    const element2 = document.body.appendChild(document.createElement('textarea'));

    const field = createField({ foo: 111 }, uncontrolledPlugin(accessorMock));

    field.at('foo').refCallback(element1);

    expect(accessorMock.set).toHaveBeenCalledTimes(1);
    expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element1], 111);

    field.at('foo').refCallback(element2);

    expect(accessorMock.set).toHaveBeenCalledTimes(2);
    expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element1, element2], 111);
  });

  test('non-connected elements are ignored', () => {
    const accessorMock: ElementValueAccessor = {
      get: () => 'xxx',
      set: jest.fn(),
    };

    const element = document.createElement('input');

    const field = createField({ foo: 111 }, uncontrolledPlugin(accessorMock));

    field.at('foo').refCallback(element);

    expect(accessorMock.set).toHaveBeenCalledTimes(0);
  });

  test('mutation observer disconnects after last element is removed', done => {
    const disconnectMock = jest.spyOn(MutationObserver.prototype, 'disconnect');

    const field = createField({ foo: 111 }, uncontrolledPlugin());

    field.at('foo').refCallback(element);

    element.remove();

    queueMicrotask(() => {
      expect(disconnectMock).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
