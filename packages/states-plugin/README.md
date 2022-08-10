# States plugin for Roqueform

Plugin that enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with states methods.

```sh
npm install --save-prod @roqueform/states-plugin
```

# Usage example

```tsx
import { useField } from 'roqueform';
import { statesPlugin } from '@roqueform/states-plugin';
import isEqual from "lodash/isEqual";

export const App = () => {
  // Create a field enhanced by a plugin.
  // Also you can provide custom equality checker through parameter plugin.
  const rootField = useField({ bar: '' }, statesPlugin(isEqual));

  const handleSubmit = () => {
  };

  return (
    <form onSubmit={handleSubmit}>

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
          // You can reset dirty field and all of its derived fields and also reset values to its initial ones.
          rootField.reset();
        }}
      >
        {'Reset'}
      </button>

    </form>
  );
};
```
