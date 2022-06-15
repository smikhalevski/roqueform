import React from 'react';
import {Form, useForm} from '../main';

test('typings', () => undefined);

declare function rrr(): { foo: 'abc' } | undefined;

function typingsTest() {

  const form = useForm({foo: {bar: 'abc'}, qqq: 123});

  const form2 = useForm(form, ['foo', 'bar']);

  const form3 = useForm(form, 'foo');

  const form4 = useForm(form, {
    get(v) {
      return v.foo.bar;
    },
    set(v, a) {
      return {foo: {bar: '123'}, qqq: 345};
    }
  });


  const a = (
      <Form
          // <{foo: string}>
          // initialValue={rrr}
          // initialValue={{foo: 'abc'}}
          // parent={form}
          // accessor={['foo', 'bar']}
          // accessor={'foo'}
          // accessor={{
          //   get(v) {
          //     return v.foo.bar;
          //   },
          //   set() {
          //     return {foo: {bar: '123'}, qqq: 345};
          //   }
          // }}
      >
        {(form) => (
            <input
                type="text"
                value={form.value.foo.bar}
                onChange={(e) => form.setValue({foo: {bar: e.target.value}, qqq: 123})}
            />
        )}
      </Form>
  );
}
