# DOM reference plugin for Roqueform

Associates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with DOM elements.

```sh
npm install --save-prod @roqueform/ref-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_ref_plugin.html)

```tsx
import { useEffect } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';
import { refPlugin } from '@roqueform/ref-plugin';

export const App = () => {
  const planetField = useField({ name: 'Venus' }, refPlugin());

  useEffect(() => {
    planetField.at('name').scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <FieldRenderer field={planetField.at('name')}>
      {nameField => (
        <input
          ref={nameField.refCallback}
          value={nameField.value}
          onChange={event => {
            nameField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>
  );
};
```
