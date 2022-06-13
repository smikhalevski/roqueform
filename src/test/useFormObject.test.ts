import {useFormObject} from '../main';

describe('useFormObject', () => {

  test('', () => {

    const formObject = useFormObject({foo: 123, bar: {baz: 'abc'}});

    const formObject2 = useFormObject(formObject, 'bar');

    formObject2.setValue({baz: 'qwe'})



  })
});