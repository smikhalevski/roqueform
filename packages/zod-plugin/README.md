# Zod plugin for Roqueform

Validates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with [Zod](https://zod.dev/) schemas.

```sh
npm install --save-prod @roqueform/zod-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/zod_plugin.html)

```tsx
import { SyntheticEvent } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';
import { zodPlugin } from '@roqueform/zod-plugin';
import { z } from 'zod';

const planetSchema = z.object({
  name: z.string().min(1),
});

export const App = () => {
  const planetField = useField({ name: '' }, zodPlugin(planetSchema));

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (planetField.validate()) {
      // Errors are associated with fields automatically
      return;
    }

    // If your shapes have transformations or refinements, you can safely parse
    // the field value after it was successfully validated
    const value = planetSchema.parse(planetField.value);
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={planetField.at('name')}>
        {nameField => (
          <>
            <input
              value={nameField.value}
              onChange={event => {
                nameField.setValue(event.target.value);
              }}
            />

            {nameField.error?.message}
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
