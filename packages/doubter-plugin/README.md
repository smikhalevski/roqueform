# Doubter plugin for Roqueform

Enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with validation methods powered by
[Doubter](https://github.com/smikhalevski/doubter#readme).

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/roqueform-doubter-plugin-example-74hkgw)

```sh
npm install --save-prod @roqueform/doubter-plugin
```

- [Usage example](#usage-example)
- [Validating fields](#validating-fields)
- [Managing errors manually](#managing-errors-manually)
- [Custom error messages](#custom-error-messages)

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/Doubter_plugin.html)

```tsx
import { SyntheticEvent } from 'react';
import { FieldRenderer, useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

// Define a value shape using Doubter
const valueShape = d.object({
  bar: d.string().min(1),
});

export const App = () => {
  const rootField = useField({ bar: '' }, doubterPlugin(valueShape));

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    if (rootField.validate()) {
      // Errors are associated with fields automatically
      return;
    }

    // If your shapes have transformations, you can safely parse
    // the field value after it was successfully validated
    const value = rootField.shape.parse(rootField.value);
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

# Validating fields

First, you should first define a field value shape using [Doubter](https://github.com/smikhalevski/doubter#readme).

```ts
import * as d from 'doubter';

const valueShape = d.object({
  bar: d.string().min(5)
});
// → Shape<{ bar: string }>
```

Then you can create a new field and enhance it with validation methods:

```ts
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';

const rootField = useField({ bar: 'qux' }, doubterPlugin(valueShape));
```

Type of the field value is inferred from the provided shape, so everything remains statically checked.

When you call the `validate` method it triggers validation of the field and all of its derived fields. So if you call
`validate` on the derived field, it won't validate the parent field:

```ts
rootField.at('bar').validate();
// → [{ message: 'Must have the minimum length of 5', … }]
```

In this example, `rootField.value` isn't validated, but `rootField.at('bar').value` is validated.

It's safe to trigger validation of a single text field on every keystroke, since validation doesn't have to process the
whole form object.

To detect whether the field, or any of its derived fields contain a validation error:

```ts
rootField.invalid;
// → true
```

To retrieve an error associated with a particular field:

```ts
rootField.at('bar').error;
// → { message: 'Must have the minimum length of 5', … }
```

# Managing errors manually

You can manually associate an error with the field:

```ts
rootField.at('bar').setError({ message: 'Oh, snap!' });
```

This may come handy when you want to mix client-side and server-side validation.

To delete an error for the particular field:

```ts
rootField.at('bar').deleteError();
```

Sometimes it is required to clear errors of the field itself and all of its derived fields:

```ts
rootField.clearErrors();
```

# Custom error messages

You can customize messages for errors raised by Doubter (the component code is omitted for clarity):

```ts
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

const valueShape = d.array(d.string(), 'Expected an array').min(3, 'Not enough elements');

const rootField = useField([], doubterPlugin(valueShape));

rootField.validate();

rootField.error;
// → { message: 'Not enough elements', … }
```
