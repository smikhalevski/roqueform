import {useFormObject} from '../main';

describe('useFormObject', () => {

  test('', () => {

    const formObject = useFormObject<{foo: number, bar: {baz: string}}>();

    const formObject2 = useFormObject(formObject, 'foo');

    formObject2.setValue(123)



  })
});