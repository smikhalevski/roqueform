import React from 'react';
import {Form} from '../main/Form';
import {useFormObject} from '../main';

const formObject = useFormObject({aaa: ['qwe']})

const a = (
    <Form
        upstream={formObject}
        accessor={['aaa', 0]}
    >
      {(formObject) => (
          <input
              value={formObject.value}
              onChange={(e) => formObject.setValue(e.target.value)}
          />
      )}
    </Form>
);
