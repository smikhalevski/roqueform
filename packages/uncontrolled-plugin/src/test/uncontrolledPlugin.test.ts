import { ElementValueAccessor, uncontrolledPlugin } from '../main';
import { composePlugins, createField, naturalAccessor } from 'roqueform';
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
    const subscriberMock = jest.fn();
    const field = createField({ foo: 0 }, uncontrolledPlugin());

    element.type = 'number';

    field.subscribe(subscriberMock);
    field.at('foo').ref(element);

    fireEvent.change(element, { target: { value: '111' } });

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(field.value).toEqual({ foo: 111 });
  });

  test('updates input value on field change', () => {
    const field = createField({ foo: 0 }, uncontrolledPlugin());

    field.at('foo').ref(element);
    field.at('foo').setValue(111);

    expect(element.value).toBe('111');
  });

  test('sets the initial value to the element', () => {
    const field = createField({ foo: 111 }, uncontrolledPlugin());

    element.type = 'number';

    field.at('foo').ref(element);

    expect(element.value).toBe('111');
  });

  test('invokes ref from the preceding plugin', () => {
    const refMock = jest.fn();
    const pluginMock = jest.fn(field => {
      field.ref = refMock;
    });

    const field = createField({ foo: 111 }, composePlugins(pluginMock, uncontrolledPlugin()));

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field, naturalAccessor, expect.any(Function));

    expect(refMock).not.toHaveBeenCalled();

    field.at('foo').ref(element);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenNthCalledWith(1, element);
  });

  test('does not invoke preceding plugin if an additional element is added', () => {
    const refMock = jest.fn();
    const plugin = (field: any) => {
      field.ref = refMock;
    };

    const element1 = document.body.appendChild(document.createElement('input'));
    const element2 = document.body.appendChild(document.createElement('input'));

    const field = createField({ foo: 111 }, composePlugins(plugin, uncontrolledPlugin()));

    field.at('foo').ref(element1);
    field.at('foo').ref(element2);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenNthCalledWith(1, element1);
  });

  test('invokes preceding plugin if the head element has changed', done => {
    const refMock = jest.fn();
    const plugin = (field: any) => {
      field.ref = refMock;
    };

    const element1 = document.body.appendChild(document.createElement('input'));
    const element2 = document.body.appendChild(document.createElement('textarea'));

    const field = createField({ foo: 111 }, composePlugins(plugin, uncontrolledPlugin()));

    field.at('foo').ref(element1);
    field.at('foo').ref(element2);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenNthCalledWith(1, element1);

    element1.remove();

    queueMicrotask(() => {
      expect(refMock).toHaveBeenCalledTimes(2);
      expect(refMock).toHaveBeenNthCalledWith(2, element2);
      done();
    });
  });

  test('invokes preceding plugin if the head element was removed', done => {
    const refMock = jest.fn();
    const plugin = (field: any) => {
      field.ref = refMock;
    };

    const field = createField({ foo: 111 }, composePlugins(plugin, uncontrolledPlugin()));

    field.at('foo').ref(element);

    element.remove();

    queueMicrotask(() => {
      expect(refMock).toHaveBeenCalledTimes(2);
      expect(refMock).toHaveBeenNthCalledWith(1, element);
      expect(refMock).toHaveBeenNthCalledWith(2, null);
      done();
    });
  });

  test('null refs are not propagated to preceding plugin', () => {
    const refMock = jest.fn();
    const plugin = (field: any) => {
      field.ref = refMock;
    };

    const field = createField({ foo: 111 }, composePlugins(plugin, uncontrolledPlugin()));

    field.at('foo').ref(null);

    expect(refMock).not.toHaveBeenCalled();
  });

  test('does not call setValue if the same value multiple times', () => {
    const accessorMock: ElementValueAccessor = {
      get: jest.fn(() => 'xxx'),
      set: jest.fn(),
    };

    const field = createField('aaa', uncontrolledPlugin(accessorMock));

    const setValueMock = (field.setValue = jest.fn(field.setValue));

    field.ref(element);

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

    field.at('foo').ref(element);

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

    field.at('foo').ref(element1);

    expect(accessorMock.set).toHaveBeenCalledTimes(1);
    expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element1], 111);

    field.at('foo').ref(element2);

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

    field.at('foo').ref(element);

    expect(accessorMock.set).toHaveBeenCalledTimes(0);
  });

  test('mutation observer disconnects after last element is removed', done => {
    const disconnectMock = jest.spyOn(MutationObserver.prototype, 'disconnect');

    const field = createField({ foo: 111 }, uncontrolledPlugin());

    field.at('foo').ref(element);

    element.remove();

    queueMicrotask(() => {
      expect(disconnectMock).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
