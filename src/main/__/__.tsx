import React from 'react';
import {Form} from './Form';
import {useForm} from './useForm';

const form = useForm({foo: {bar: 'abc'}});

const a = (
    <Form
        upstream={form}
        accessor={['foo']}
        onChange={(value) => undefined}
    >
      {(form) => (
          <input
              type="text"
              value={form.value.bar}
              onChange={(e) => form.setValue({bar: e.target.value})}
          />
      )}
    </Form>
);


// TODO useFormManager
// TODO Form manager listener --> subscribe
// TODO FormProps.onChange via useFormManager().subscribe