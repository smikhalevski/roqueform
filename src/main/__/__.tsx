import React from 'react';
import {Form} from './Form';
import {useForm} from './useForm';

const form = useForm({foo: {bar: 'abc'}});

const a = (
    <Form
        upstream={form}
    >
      {(form) => (
          <input
              type="text"
              value={form.value}
              onChange={(e) => form.setValue(e.target.value)}
          />
      )}
    </Form>
);
