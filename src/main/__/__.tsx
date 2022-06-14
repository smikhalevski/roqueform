import React from 'react';
import {Form} from './Form';
import {useForm} from './useForm';

const form = useForm({foo: {bar: 'abc'}, qqq: 123});

const form2 = useForm(form, ['foo', 'bar'], {eager: true});

const form3 = useForm(form, ['foo']);

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
        <{foo: string}>
        // initialValue={{foo: 'abc'}}
        // upstream={form}
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
              value={form.value.foo}
              onChange={(e) => form.setValue({foo: e.target.value})}
          />
      )}
    </Form>
);


// TODO useFormManager
// TODO Form manager listener --> subscribe
// TODO FormProps.onChange via useFormManager().subscribe