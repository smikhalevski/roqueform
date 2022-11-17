# Reset plugin for Roqueform

Enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with methods to manage the initial value
and reset the field value.

```sh
npm install --save-prod @roqueform/reset-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/reset_plugin_src_main.html)

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to the `resetPlugin`. By default, values are compared using
[fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal).

```tsx
import { useField } from 'roqueform';
import { resetPlugin } from '@roqueform/reset-plugin';

export const App = () => {
  const rootField = useField({ bar: '' }, resetPlugin());

  return (
    <form>

      <Field field={rootField.at('bar')}>
        {barField => (
          <input
            value={barField.value}
            onChange={event => {
              barField.setValue(event.target.value);
            }}
          />
        )}
      </Field>

      <button
        type="submit"
        disabled={!rootField.dirty}
      >
        {'Submit'}
      </button>

      <button
        type="button"
        onClick={() => {
          // Reset the field to its initial value 
          rootField.reset();
        }}
      >
        {'Reset'}
      </button>

    </form>
  );
};
```
