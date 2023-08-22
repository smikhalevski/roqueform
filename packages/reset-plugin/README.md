# Reset plugin for Roqueform

Manages [Roqueform](https://github.com/smikhalevski/roqueform#readme) field initial value and dirty status.

```sh
npm install --save-prod @roqueform/reset-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_reset_plugin.html)

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to the `resetPlugin`. By default, values are compared using
[fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal).

```tsx
import { FieldRenderer, useField } from '@roqueform/react';
import { resetPlugin } from '@roqueform/reset-plugin';

export const App = () => {
  const planetField = useField({ name: 'Pluto' }, resetPlugin());

  return (
    <form>

      <FieldRenderer field={planetField.at('name')}>
        {nameField => (
          <input
            value={nameField.value}
            onChange={event => {
              nameField.setValue(event.target.value);
            }}
          />
        )}
      </FieldRenderer>

      <button
        type="submit"
        disabled={!planetField.isDirty}
      >
        {'Submit'}
      </button>

      <button
        type="button"
        // Reset the field to its initial value 
        onClick={planetField.reset}
      >
        {'Reset'}
      </button>

    </form>
  );
};
```
