# Constraint validation API plugin for Roqueform

Plugin that enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with validation methods
that use [Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).

```sh
npm install --save-prod @roqueform/validity-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/validity_plugin_src_main.html)

```tsx
import { useEffect } from 'react';
import { useField } from 'roqueform';
import { validityPlugin } from '@roqueform/validity-plugin';

export const App = () => {

  const rootField = useField({ bar: 'qux' }, validityPlugin());

  useEffect(() => {
    rootField.validate();
  }, []);

  return (
    <Field field={rootField.at('bar')}>
      {barField => (
        <input
          ref={barField.refCallback}
          value={barField.value}
          onChange={event => {
            barField.setValue(event.target.value);
          }}
          aria-invalid={barField.invalid}
          aria-errormessage={barField.error}
        />
      )}
    </Field>
  );
};
```
