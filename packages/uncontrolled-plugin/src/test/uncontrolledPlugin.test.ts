import { ElementsValueAccessor, uncontrolledPlugin } from '../main';
import { composePlugins, createField } from 'roqueform';
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
    const field = createField({ aaa: 111 }, uncontrolledPlugin());

    element.type = 'number';

    field.on('*', subscriberMock);
    field.at('aaa').ref(element);

    fireEvent.input(element, { target: { value: '222' } });

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(field.value).toEqual({ aaa: 222 });
  });

  test('updates input value on field change', () => {
    const field = createField({ aaa: 111 }, uncontrolledPlugin());

    field.at('aaa').ref(element);
    field.at('aaa').setValue(222);

    expect(element.value).toBe('222');
  });

  test('sets the initial value to the element', () => {
    const field = createField({ aaa: 111 }, uncontrolledPlugin());

    element.type = 'number';

    field.at('aaa').ref(element);

    expect(element.value).toBe('111');
  });

  test('invokes ref from the preceding plugin', () => {
    const refMock = jest.fn();
    const pluginMock = jest.fn(field => {
      field.ref = refMock;
    });

    const field = createField({ aaa: 111 }, composePlugins(pluginMock, uncontrolledPlugin()));

    expect(pluginMock).toHaveBeenCalledTimes(1);
    expect(pluginMock).toHaveBeenNthCalledWith(1, field);

    expect(refMock).not.toHaveBeenCalled();

    field.at('aaa').ref(element);

    expect(refMock).toHaveBeenCalledTimes(1);
    expect(refMock).toHaveBeenNthCalledWith(1, element);
  });

  // test('does not invoke preceding plugin if an additional element is added', () => {
  //   const refMock = jest.fn();
  //   const plugin = (field: any) => {
  //     field.ref = refMock;
  //   };
  //
  //   const element1 = document.body.appendChild(document.createElement('input'));
  //   const element2 = document.body.appendChild(document.createElement('input'));
  //
  //   const field = createField({ aaa: 111 }, composePlugins(plugin, uncontrolledPlugin()));
  //
  //   field.at('aaa').refFor(1)(element1);
  //   field.at('aaa').refFor(2)(element2);
  //
  //   expect(refMock).toHaveBeenCalledTimes(1);
  //   expect(refMock).toHaveBeenNthCalledWith(1, element1);
  // });
  //
  // test('invokes preceding plugin if the head element has changed', done => {
  //   const refMock = jest.fn();
  //   const plugin = (field: any) => {
  //     field.ref = refMock;
  //   };
  //
  //   const element1 = document.body.appendChild(document.createElement('input'));
  //   const element2 = document.body.appendChild(document.createElement('textarea'));
  //
  //   const field = createField({ aaa: 111 }, composePlugins(plugin, uncontrolledPlugin()));
  //
  //   field.at('aaa').ref(element1);
  //   field.at('aaa').ref(element2);
  //
  //   expect(refMock).toHaveBeenCalledTimes(1);
  //   expect(refMock).toHaveBeenNthCalledWith(1, element1);
  //
  //   element1.remove();
  //
  //   queueMicrotask(() => {
  //     expect(refMock).toHaveBeenCalledTimes(2);
  //     expect(refMock).toHaveBeenNthCalledWith(2, element2);
  //     done();
  //   });
  // });
  //
  // test('invokes preceding plugin if the head element was removed', done => {
  //   const refMock = jest.fn();
  //   const plugin = (field: any) => {
  //     field.ref = refMock;
  //   };
  //
  //   const field = createField({ aaa: 111 }, composePlugins(plugin, uncontrolledPlugin()));
  //
  //   field.at('aaa').ref(element);
  //
  //   element.remove();
  //
  //   queueMicrotask(() => {
  //     expect(refMock).toHaveBeenCalledTimes(2);
  //     expect(refMock).toHaveBeenNthCalledWith(1, element);
  //     expect(refMock).toHaveBeenNthCalledWith(2, null);
  //     done();
  //   });
  // });
  //
  // test('null refs are not propagated to preceding plugin', () => {
  //   const refMock = jest.fn();
  //   const plugin = (field: any) => {
  //     field.ref = refMock;
  //   };
  //
  //   const field = createField({ aaa: 111 }, composePlugins(plugin, uncontrolledPlugin()));
  //
  //   field.at('aaa').ref(null);
  //
  //   expect(refMock).not.toHaveBeenCalled();
  // });

  test('does not call setValue if the same value multiple times', () => {
    const elementsValueAccessorMock: ElementsValueAccessor = {
      get: jest.fn(() => 'xxx'),
      set: jest.fn(),
    };

    const field = createField('aaa', uncontrolledPlugin(elementsValueAccessorMock));

    const setValueSpy = jest.spyOn(field, 'setValue');

    field.ref(element);

    expect(elementsValueAccessorMock.set).toHaveBeenCalledTimes(1);
    expect(elementsValueAccessorMock.set).toHaveBeenNthCalledWith(1, [element], 'aaa');
    expect(elementsValueAccessorMock.get).not.toHaveBeenCalled();
    expect(setValueSpy).not.toHaveBeenCalled();

    fireEvent.change(element, { target: { value: 'bbb' } });
    fireEvent.input(element, { target: { value: 'bbb' } });

    expect(setValueSpy).toHaveBeenCalledTimes(1);
    expect(setValueSpy).toHaveBeenNthCalledWith(1, 'xxx');

    expect(elementsValueAccessorMock.set).toHaveBeenCalledTimes(2);
    expect(elementsValueAccessorMock.set).toHaveBeenNthCalledWith(2, [element], 'xxx');
  });

  test('uses accessor to set values to the element', () => {
    const accessorMock: ElementsValueAccessor = {
      get: () => undefined,
      set: jest.fn(),
    };

    const field = createField({ aaa: 111 }, uncontrolledPlugin(accessorMock));

    field.at('aaa').ref(element);

    expect(accessorMock.set).toHaveBeenCalledTimes(1);
    expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element], 111);

    field.at('aaa').setValue(222);

    expect(accessorMock.set).toHaveBeenCalledTimes(2);
    expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element], 222);
  });

  test('does not call set accessor if there are no referenced elements', () => {
    const accessorMock: ElementsValueAccessor = {
      get: () => undefined,
      set: jest.fn(),
    };

    const field = createField({ aaa: 111 }, uncontrolledPlugin(accessorMock));

    field.at('aaa').setValue(222);

    expect(accessorMock.set).not.toHaveBeenCalled();
  });

  test('multiple elements are passed to set accessor', () => {
    const accessorMock: ElementsValueAccessor = {
      get: () => 'xxx',
      set: jest.fn(),
    };

    const element1 = document.body.appendChild(document.createElement('input'));
    const element2 = document.body.appendChild(document.createElement('textarea'));

    const field = createField({ aaa: 111 }, uncontrolledPlugin(accessorMock));

    field.at('aaa').ref(element1);

    expect(accessorMock.set).toHaveBeenCalledTimes(1);
    expect(accessorMock.set).toHaveBeenNthCalledWith(1, [element1], 111);

    field.at('aaa').ref(element2);

    expect(accessorMock.set).toHaveBeenCalledTimes(2);
    expect(accessorMock.set).toHaveBeenNthCalledWith(2, [element1, element2], 111);
  });

  test('non-connected elements are ignored', () => {
    const accessorMock: ElementsValueAccessor = {
      get: () => 'xxx',
      set: jest.fn(),
    };

    const element = document.createElement('input');

    const field = createField({ aaa: 111 }, uncontrolledPlugin(accessorMock));

    field.at('aaa').ref(element);

    expect(accessorMock.set).toHaveBeenCalledTimes(0);
  });

  test('mutation refr disconnects after last element is removed', done => {
    const disconnectMock = jest.spyOn(MutationObserver.prototype, 'disconnect');

    const field = createField({ aaa: 111 }, uncontrolledPlugin());

    field.at('aaa').ref(element);

    element.remove();

    queueMicrotask(() => {
      expect(disconnectMock).toHaveBeenCalledTimes(1);
      done();
    });
  });
});
