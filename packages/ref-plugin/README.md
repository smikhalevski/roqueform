# DOM reference plugin for Roqueform

Enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with DOM-related methods.

```sh
npm install --save-prod @roqueform/ref-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/ref_plugin_src_main.html)

```tsx
import { useEffect } from 'react';
import { useField } from 'roqueform';
import { refPlugin } from '@roqueform/ref-plugin';

export const App = () => {

  const rootField = useField({ bar: 'qux' }, refPlugin());

  useEffect(() => {
    rootField.at('bar').scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <Field field={rootField.at('bar')}>
      {barField => (
        <input
          ref={barField.refCallback}
          value={barField.value}
          onChange={event => {
            barField.dispatchValue(event.target.value);
          }}
        />
      )}
    </Field>
  );
};
```
