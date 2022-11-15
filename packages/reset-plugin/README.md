# Reset plugin for Roqueform

Enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with methods to manage the initial value.

```sh
npm install --save-prod @roqueform/reset-plugin
```

# Usage example

🔎[API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/reset_plugin_src_main.html)

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to the `resetPlugin`. By default, values are compared using `Object.is`.

```tsx
import { useField } from 'roqueform';
import { resetPlugin } from '@roqueform/reset-plugin';
import isEqual from "lodash/isEqual";

export const App = () => {
  // Provide an optional equality checker
  const rootField = useField({ bar: '' }, resetPlugin(isEqual));

  return (
    <form>

      <Field field={rootField.at('bar')}>
        {barField => (
          <input
            value={barField.getValue()}
            onChange={event => {
              barField.dispatchValue(event.target.value);
            }}
          />
        )}
      </Field>

      <button
        type="submit"
        disabled={!rootField.isDirty()}
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
