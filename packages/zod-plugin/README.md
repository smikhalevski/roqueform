# Zod plugin for Roqueform

Plugin that enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with validation methods
powered by [Zod](https://zod.dev/).

```sh
npm install --save-prod @roqueform/zod-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_zod_plugin.html)

```tsx
import { SyntheticEvent } from 'react';
import { FieldRenderer, useField } from 'roqueform';
import { zodPlugin } from '@roqueform/zod-plugin';
import { z } from 'zod';

// Define a value shape using Zod
const valueType = d.object({
  bar: d.string().min(1),
});

export const App = () => {
  const rootField = useField({ bar: '' }, zodPlugin(valueType));

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    if (rootField.validate()) {
      // Errors are associated with fields automatically
      return;
    }

    // If your shapes have transformations, you can safely parse
    // the field value after it was successfully validated
    const value = valueType.parse(rootField.value);
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={rootField.at('bar')}>
        {barField => (
          <>
            <input
              value={barField.value}
              onChange={event => {
                barField.setValue(event.target.value);
              }}
              aria-invalid={barField.invalid}
            />

            {barField.error?.message}
          </>
        )}
      </FieldRenderer>

      <button type="submit">
        {'Submit'}
      </button>

    </form>
  );
};
```
