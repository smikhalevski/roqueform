import { createField, errorsPlugin } from 'roqueform';

describe('errorsPlugin', () => {
  test('enhances the field', () => {
    const field = createField({ aaa: 111 }, errorsPlugin());

    expect(field.errors.length).toBe(0);
    expect(field.isInvalid).toBe(false);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);
  });

  test('adds an error to the root field', () => {
    const field = createField({ aaa: 111 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const errors = field.errors;

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.addError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toEqual([222]);
    expect(field.errors).not.toBe(errors);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('adds an error to the child field', () => {
    const field = createField({ aaa: 111 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').addError(222);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([222]);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
  });

  test('does not add duplicated error by default', () => {
    const field = createField({ aaa: 111 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.addError(222);
    field.addError(222);

    expect(field.isInvalid).toBe(true);
    expect(field.errors).toEqual([222]);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('uses errorMerger to add a new error', () => {
    const errors = [333];
    const concatErrorsMock = jest.fn(() => errors);

    const field = createField({ aaa: 111 }, errorsPlugin(concatErrorsMock));

    field.addError(222);

    expect(field.errors).toEqual(errors);
    expect(concatErrorsMock).toHaveBeenCalledTimes(1);
    expect(concatErrorsMock).toHaveBeenNthCalledWith(1, [], 222);
  });

  test('deletes an error from the root field', () => {
    const field = createField({ aaa: 111 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.addError(222);
    field.deleteError(222);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('deletes an error from the child field', () => {
    const field = createField({ aaa: 111 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').addError(222);
    field.at('aaa').deleteError(222);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(2);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('deletes an error from the child field but parent remains invalid', () => {
    const field = createField({ aaa: 111, bbb: 222 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').addError(333);
    field.at('bbb').addError(444);

    field.at('bbb').deleteError(444);

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(true);
    expect(field.at('aaa').errors).toEqual([333]);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(3);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(bbbSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('clears errors recursively', () => {
    const field = createField({ aaa: 111, bbb: 222 }, errorsPlugin());

    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();
    const bbbSubscriberMock = jest.fn();

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);
    field.at('bbb').on('*', bbbSubscriberMock);

    field.at('aaa').addError(333);
    field.at('bbb').addError(444);

    field.clearErrors({ recursive: true });

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').errors.length).toBe(0);

    expect(field.at('bbb').isInvalid).toBe(false);
    expect(field.at('bbb').errors.length).toBe(0);

    expect(subscriberMock).toHaveBeenCalledTimes(4);
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(2);
    expect(bbbSubscriberMock).toHaveBeenCalledTimes(2);
  });

  test('clears errors from nested fields', () => {
    const field = createField(
      {
        aaa: {
          bbb: {
            ccc: 111,
            ddd: 222,
          },
        },
      },
      errorsPlugin()
    );

    field.at('aaa').at('bbb').at('ccc').addError(333);
    field.at('aaa').at('bbb').at('ddd').addError(444);

    field.clearErrors({ recursive: true });

    expect(field.isInvalid).toBe(false);
    expect(field.errors.length).toBe(0);

    expect(field.at('aaa').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').at('ccc').isInvalid).toBe(false);
    expect(field.at('aaa').at('bbb').at('ddd').isInvalid).toBe(false);
  });
});
