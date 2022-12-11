# Reset plugin for Roqueform

Enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with methods that manage the initial value.

```sh
npm install --save-prod @roqueform/reset-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/Reset_Plugin.html)

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to the `resetPlugin`. By default, values are compared using
[fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal).

```tsx
import { FieldRenderer, useField } from 'roqueform';
import { resetPlugin } from '@roqueform/reset-plugin';

export const App = () => {
  const rootField = useField({ bar: '' }, resetPlugin());

  return (
    <form>

      <FieldRenderer field={rootField.at('bar')}>
        {barField => (
          <input
            value={barField.value}
            onChange={event => {
              barField.setValue(event.target.value);
            }}
          />
        )}
      </FieldRenderer>

      <button
        type="submit"
        disabled={!rootField.dirty}
      >
        {'Submit'}
      </button>

      <button
        type="button"
        // Reset the field to its initial value 
        onClick={rootField.reset}
      >
        {'Reset'}
      </button>

    </form>
  );
};
```
