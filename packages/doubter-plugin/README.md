# Doubter plugin for Roqueform

Plugin that enhances [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with validation methods
powered by [Doubter](https://github.com/smikhalevski/doubter#readme).

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/roqueform-doubter-plugin-example-74hkgw)

```sh
npm install --save-prod @roqueform/doubter-plugin
```

- [Usage example](#usage-example)
- [Validating fields](#validating-fields)
- [Manage issues manually](#manage-issues-manually)
- [Custom issue messages](#custom-issue-messages)

# Usage example

🔎[API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/doubter_plugin_src_main.html)

```tsx
import { SyntheticEvent } from 'react';
import { useField, Field } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

// Define a runtime type using Doubter DSL
const valueType = d.object({
  bar: d.string().min(1),
});

export const App = () => {

  // Create a field enhanced by a plugin
  const rootField = useField({ bar: '' }, doubterPlugin(valueType));

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    // Trigger validation
    rootField.validate();

    if (rootField.isInvalid()) {
      // Isses are associated with fields automatically
      return;
    }

    // The form value to submit
    const value = rootField.getValue();
  };

  return (
    <form onSubmit={handleSubmit}>

      <Field field={rootField.at('bar')}>
        {barField => (
          <>
            <input
              value={barField.getValue()}
              onChange={event => {
                barField.dispatchValue(event.target.value);
              }}
              aria-invalid={barField.isInvalid()}
            />

            {barField.getIssue()?.message}
          </>
        )}
      </Field>

      <button type="submit">
        {'Submit'}
      </button>

    </form>
  );
};
```

# Validating fields

First, you should first define your runtime data types using [Doubter](https://github.com/smikhalevski/doubter#readme)
DSL.

```ts
import * as d from 'doubter';

const valueType = d.object({
  bar: d.string().min(5)
});
// → Type<{ bar: string }>
```

Then you can create a new field and enhance it with validation methods:

```ts
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';

const rootField = useField({ bar: 'qux' }, doubterPlugin(valueType));
```

Type of the field value is inferred from the provided runtime type definition, so everything remains statically checked
even there's no TypeScript types were explicitly specified.

When you call the `validate` method it triggers validation of the field and all of its derived fields. So if you call
`validate` on the derived field, it won't validate the parent field:

```ts
// rootField is not validated here! 
rootField.at('bar').validate();
```

So it's safe to trigger validation of a single text field on every keystroke, since it does't have an overhead of
validating the whole form object. On the other hand, you can validate the whole form by calling validate on the root
field.

To detect whether the field, or any of its derived fields contain an issue:

```ts
rootField.isInvalid();
// → true
```

To retrieve an issue associated with a particular field:

```ts
rootField.at('bar').getIssue();
// → { message: 'Must have the minimum length of 5', … }
```

# Manage issues manually

You can manually associate an issue with the field:

```ts
rootField.at('bar').setIssue({ message: 'Oh, snap!' });
```

This allows you to mix client-side and server-side validation using the same mechanism.

To delete an issue for the particular field:

```ts
rootField.at('bar').deleteIssue();
```

Sometimes it is required to clear issues of the field itself and all of its derived fields:

```ts
rootField.clearIssues();
```

# Custom issue messages

You can customize messages for issues raised by Doubter (the component code is omitted for clarity):

```ts
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

const valueType = d.array(d.string(), { message: 'Expected an array' })
  .min(3, { message: 'Not enough' });

const rootField = useField([], doubterPlugin(valueType));

rootField.validate();

rootField.getIssue();
// → { message: 'Not enough', … }
```
