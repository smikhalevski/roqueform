# Doubter plugin for Roqueform

Validates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with
[Doubter](https://github.com/smikhalevski/doubter#readme) shapes.

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/74hkgw)

```sh
npm install --save-prod @roqueform/doubter-plugin
```

- [Usage example](#usage-example)
- [Validating fields](#validating-fields)
- [Managing errors manually](#managing-errors-manually)
- [Custom error messages](#custom-error-messages)

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_doubter_plugin.html)

```tsx
import { SyntheticEvent } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

const planetShape = d.object({
  name: d.string().min(1),
});

export const App = () => {
  const planetField = useField({ name: '' }, doubterPlugin(planetShape));

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (planetField.validate()) {
      // If your shapes transform the input, you can safely parse
      // the field value after it was successfully validated.
      const value = planetShape.parse(planetField.value);
    } else {
      // Errors are associated with fields automatically.
    }
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
              aria-invalid={nameField.isInvalid}
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

# Validating fields

Define a field value shape using [Doubter](https://github.com/smikhalevski/doubter#readme).

```ts
import * as d from 'doubter';

const planetShape = d.object({
  name: d.string().min(5)
});
// ⮕ Shape<{ name: string }>
```

Create a new field and enhance it with the plugin:

```ts
import { useField } from '@roqueform/react';
import { doubterPlugin } from '@roqueform/doubter-plugin';

const planetField = useField({ name: 'Mars' }, doubterPlugin(planetShape));
```

The type of the field value is inferred from the provided shape, so the field value is statically checked.

When you call the `validate` method, it triggers validation of the field and all of its child fields. So if you call
`validate` on the child field, it won't validate the parent field:

```ts
planetField.at('name').validate();
// ⮕ [{ message: 'Must have the minimum length of 5', … }]
```

In this example, `planetField.value` _is not_ validated, and `planetField.at('name').value` _is_ validated.

> [!NOTE]\
> It's safe to trigger validation of a single text field on every keystroke, since validation doesn't have to process
> the whole form state.

To detect whether the field, or any of its child fields contain a validation error:

```ts
planetField.isInvalid;
// ⮕ true
```

To retrieve an error associated with a particular field:

```ts
planetField.at('name').error;
// ⮕ { message: 'Must have the minimum length of 5', … }
```

# Managing errors manually

You can manually associate an error with the field:

```ts
planetField.at('name').addError({ message: 'Oh, snap!' });
```

This may come handy when you want to mix client-side and server-side validation.

To delete an error for the particular field:

```ts
planetField.at('name').deleteError();
```

Sometimes it is required to clear errors of the field itself and all of its child fields:

```ts
planetField.clearErrors({ recursive: true });
```

# Custom error messages

You can customize messages for errors raised by Doubter (the component code is omitted for clarity):

```ts
import { useField } from '@roqueform/react';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

const valueShape = d.array(d.string(), 'Expected an array').min(3, 'Not enough elements');

const field = useField([], doubterPlugin(valueShape));

field.validate();

field.error;
// ⮕ { message: 'Not enough elements', … }
```
