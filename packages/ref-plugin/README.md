# DOM reference plugin for Roqueform

Adds the `ref` property to [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields.

```sh
npm install --save-prod @roqueform/doubter-plugin
```

# Usage example

```tsx
import { useEffect } from 'react';
import { useField } from 'roqueform';
import { refPlugin } from '@roqueform/ref-plugin';

export const App = () => {

  const rootField = useField({ bar: 'qux' }, refPlugin<HTMLInputElement>());

  useEffect(() => {
    rootField.at('bar').ref.current?.scrollIntoView();
  }, []);

  return (
    <Field field={rootField.at('bar')}>
      {barField => (
        <input
          ref={barField.ref}
          value={barField.getValue()}
          onChange={event => {
            barField.dispatchValue(event.target.value);
          }}
        />
      )}
    </Field>
  );
};
```
