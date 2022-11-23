# DOM reference plugin for Roqueform

Enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with DOM-related methods.

```sh
npm install --save-prod @roqueform/ref-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_ref_plugin.html)

```tsx
import { useEffect } from 'react';
import { FieldRenderer, useField } from 'roqueform';
import { refPlugin } from '@roqueform/ref-plugin';

export const App = () => {
  const rootField = useField({ bar: 'qux' }, refPlugin());

  useEffect(() => {
    rootField.at('bar').scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <FieldRenderer field={rootField.at('bar')}>
      {barField => (
        <input
          ref={barField.refCallback}
          value={barField.value}
          onChange={event => {
            barField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>
  );
};
```
