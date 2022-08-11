# Reset plugin for Roqueform

Plugin that enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with `reset` and `isDirty`
methods.

```sh
npm install --save-prod @roqueform/reset-plugin
```

# Usage example

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
