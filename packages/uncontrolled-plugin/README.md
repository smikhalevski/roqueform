# Uncontrolled plugin for Roqueform

Updates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields by listening to change events of associated
DOM elements.

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/fsdshx)

```sh
npm install --save-prod @roqueform/uncontrolled-plugin
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/uncontrolled_plugin.html)

This plugin doesn't require any rendering framework. To simplify the usage example, we're going to use
[the React integration](../react#readme).

```tsx
import type { SyntheticEvent } from 'react';
import { useField } from '@roqueform/react';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

export const App = () => {
  const planetField = useField(
    { name: 'Mars', properties: { color: 'red' } },
    uncontrolledPlugin()
  );

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    // The field value is always in sync with the input element value.
    doSubmit(planetField.value);
  };

  return (
    <form onSubmit={handleSubmit}>
      {'Planet name:'}
      <input
        type="text"
        ref={field.at('name').ref}
      />
      <br/>

      {'Color:'}
      {['red', 'green', 'blue'].map(color =>
        <label>
          <input
            type="radio"
            // 🌕 An arbitrary name of a radio group
            name="property-color"
            value={color}
            ref={field.at('properties').at('color').refFor(color)}
          />
          {color}
        </label>
      )}
    </form>
  );
};
```

# Referencing elements

To associate field with an element, pass
[`ref`](https://smikhalevski.github.io/roqueform/interfaces/uncontrolled_plugin.UncontrolledPlugin.html#ref)
as a `ref` attribute of an `input`, `textarea`, or any other form element:

```tsx
<input ref={field.ref}/>
```

The plugin would synchronize the field value with the value of an input element. When the input value is changed and
`change` or `input` event is dispatched, the `field` is updated with the corresponding value.

If you have a set of radio buttons, or checkboxes that update a single field, use
[`refFor`](https://smikhalevski.github.io/roqueform/interfaces/uncontrolled_plugin.UncontrolledPlugin.html#refFor) with
a distinct key. `refFor` always returns the same ref callback for the same key. `uncontrolledPlugin` would use elements
passed to ref callbacks to derive a value.

```ts
const namesField = useField(['Mars', 'Pluto'], uncontrolledPlugin());
```

The plugin derives the field value from the element's `value` attribute:

```tsx
<form>
  <input
    type="checkbox"
    value="Mars"
    // 🌕 The unique key associated with this is 1.
    ref={namesField.refFor(1)}
  />
  <input
    type="checkbox"
    value="Pluto"
    ref={namesField.refFor(2)}
  />
</form>
```

# Value coercion

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
[`ElementsValueAccessor`](https://smikhalevski.github.io/roqueform/interfaces/uncontrolled_plugin.ElementsValueAccessor.html)
implementation to a plugin. Or you can use a
[`createElementsValueAccessor`](https://smikhalevski.github.io/roqueform/functions/uncontrolled_plugin.createElementsValueAccessor.html)
factory to customise the default behaviour:

```ts
import { useField } from '@roqueform/react';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

const personField = useField(
  { dateOfBirth: 316310400000 },
  uncontrolledPlugin(
    createElementsValueAccessor({
      dateFormat: 'timestamp'
    })
  )
);
```

Read more about available options in
[`ElementsValueAccessorOptions`](https://smikhalevski.github.io/roqueform/interfaces/uncontrolled_plugin.ElementsValueAccessorOptions.html).
