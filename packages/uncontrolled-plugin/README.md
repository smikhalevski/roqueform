# Uncontrolled plugin for Roqueform

Updates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields by listening to change events of associated
DOM elements.

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/fsdshx)

```sh
npm install --save-prod @roqueform/uncontrolled-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/uncontrolled_plugin.html)

```tsx
import { SyntheticEvent } from 'react';
import { useField } from '@roqueform/react';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

export const App = () => {
  const planetField = useField(
    { planet: 'Mars', properties: { color: 'red' } },
    uncontrolledPlugin()
  );

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    // The field value is always in sync with the input element value.
    planetField.value;
  };

  return (
    <form onSubmit={handleSubmit}>
      {'Planet:'}
      <input
        type="text"
        ref={field.at('planet').refCallback}
      />
      <br/>

      {'Color:'}
      {['red', 'green', 'blue'].map(color =>
        <label>
          <input
            type="radio"
            name="color-property"
            value={color}
            ref={field.at('properties').at('color').refCallback}
          />
          {color}
        </label>
      )}
    </form>
  );
};
```

# Value coercion
To associate field with a form element, pass
[`Field.refCallback`](https://smikhalevski.github.io/roqueform/interfaces/_roqueform_ref_plugin.RefMixin.html#refCallback)
as a `ref` attribute of an `input`, `textarea`, or any other form element:

```tsx
<input ref={field.refCallback}/>
```

The plugin would synchronize the field value with the value of an input element. When the input value is changed and
`change` or `input` event is dispatched, `field` is updated with the corresponding value.

If you have a set of radio buttons, or checkboxes that update a single field, provide the same `refCallback` to all
inputs, `uncontrolledPlugin` would use them a source of values.

```ts
const namesField = useField(['Mars', 'Pluto'], uncontrolledPlugin());
```

The plugin relies only on `value` attribute, so `name` and other attributes are optional:

```tsx
<form>
  <input
    type="checkbox"
    value="Mars"
    ref={namesField.refCallback}
  />
  <input
    type="checkbox"
    value="Pluto"
    // 🟡 Note that the same refCallback is passed to two inputs
    ref={namesField.refCallback}
  />
</form>
```

By default, `uncontrolledPlugin` uses the opinionated element value accessor that applies following coercion rules to
values of form elements:

- Single checkbox → boolean;

- Multiple checkboxes → an array of `value` attributes of checked checkboxes;

- Radio buttons → the `value` attribute of a radio button that is checked or `null` if no radio buttons are checked;

- Number input → number, or `null` if empty;

- Range input → number;

- Date input → the `value` attribute, or `null` if empty;

- Time input → a time string, or `null` if empty;

- Image input → string value of the `src` attribute;

- File input → `File` or `null` if no file selected, file inputs are read-only;

- Multi-file input → array of `File`;

- Others → `value` attribute, or `null` if element doesn't support it;

- `null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to `value` attribute.

This behaviour can be changed by passing a custom
[`ElementValueAccessor`](https://smikhalevski.github.io/roqueform/interfaces/uncontrolled_plugin.ElementValueAccessor.html)
implementation to a plugin. Or you can use a
[`createElementValueAccessor`](https://smikhalevski.github.io/roqueform/functions/uncontrolled_plugin.createElementValueAccessor.html)
factory to customise the default behaviour:

```ts
import { useField } from '@roqueform/react';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

const personField = useField(
  { dateOfBirth: 316310400000 },
  uncontrolledPlugin(
    createElementValueAccessor({ dateFormat: 'timestamp' })
  )
);
```

Read more about available options in
[`ElementValueAccessorOptions`](https://smikhalevski.github.io/roqueform/interfaces/uncontrolled_plugin.ElementValueAccessorOptions.html).
