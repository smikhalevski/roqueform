import { createField } from 'roqueform';
import { AnnotationsPatcher, annotationsPlugin } from '../main';

describe('annotationsPlugin', () => {
  test('annotations are an empty object by default', () => {
    const field = createField({ aaa: 111 }, annotationsPlugin());

    expect(field.annotations).toEqual({});
    expect(field.at('aaa').annotations).toEqual({});
  });

  test('populates annotations with defaults', () => {
    const initialValue = { aaa: 111 };

    const field = createField(initialValue, annotationsPlugin({ xxx: 222 }));

    expect(field.annotations.xxx).toBe(222);
    expect(field.at('aaa').annotations.xxx).toBe(222);
  });

  test('patches root field annotations', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 }, annotationsPlugin({ xxx: 222 }));

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.annotate({ xxx: 333 });

    expect(field.annotations.xxx).toBe(333);
    expect(field.at('aaa').annotations.xxx).toBe(222);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:annotations',
      target: field,
      origin: field,
      data: { xxx: 222 },
    });
    expect(aaaSubscriberMock).not.toHaveBeenCalled();
  });

  test('patches child field annotations', () => {
    const subscriberMock = jest.fn();
    const aaaSubscriberMock = jest.fn();

    const field = createField({ aaa: 111 }, annotationsPlugin({ xxx: 222 }));

    field.on('*', subscriberMock);
    field.at('aaa').on('*', aaaSubscriberMock);

    field.at('aaa').annotate({ xxx: 333 });

    expect(field.annotations.xxx).toBe(222);
    expect(field.at('aaa').annotations.xxx).toBe(333);

    expect(subscriberMock).toHaveBeenCalledTimes(1);
    expect(subscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:annotations',
      target: field.at('aaa'),
      origin: field.at('aaa'),
      data: { xxx: 222 },
    });
    expect(aaaSubscriberMock).toHaveBeenCalledTimes(1);
    expect(aaaSubscriberMock).toHaveBeenNthCalledWith(1, {
      type: 'change:annotations',
      target: field.at('aaa'),
      origin: field.at('aaa'),
      data: { xxx: 222 },
    });
  });

  test('uses patcher to apply patches', () => {
    const patcherMock: AnnotationsPatcher = jest.fn((a, b) => Object.assign({}, a, b));

    const field = createField(111, annotationsPlugin(patcherMock));

    field.annotate({ xxx: 222 });

    expect(patcherMock).toHaveBeenCalledTimes(1);
    expect(patcherMock).toHaveBeenNthCalledWith(1, {}, { xxx: 222 });
  });
});
