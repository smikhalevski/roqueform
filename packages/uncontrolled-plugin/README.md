# Uncontrolled elements plugin for Roqueform

Updates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields by listening to DOM change events.

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/uncontrolled-elements-plugin-example-fsdshx)

```sh
npm install --save-prod @roqueform/uncontrolled-plugin
```

# Usage

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/Uncontrolled_elements_plugin.html)

```tsx
import { useField } from 'roqueform';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

export const App = () => {
  const field = useField({ username: 'James' }, uncontrolledPlugin());

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    // The field value is always in sync with the input element value
    field.value // ⮕ { username: 'James' }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        ref={field.at('username').refCallback}
      />

      <input type="submit"/>
    </form>
  );
};
```

# Value coercion

To associate field with an element, pass `refCallback` as a `ref` attribute of an `input`, `textarea`, or any other
form element:

```tsx
<input
  type="number"
  ref={field.at('amount').refCallback}
/>
```

Now when the input value is changed and `change` or `input` event is dispatched, `field.at('amount')` is updated with
the corresponding value.

If you have a set of radio buttons, or checkboxes that update a single field, provide the same `refCallback` to all
inputs, `uncontrolledPlugin` would use them a source of values. The plugin relies only on `value` attribute, so `name`
and other attributes are optional:

```tsx
<form>
  <input
    type="checkbox"
    value="Mars"
    ref={field.at('planets').refCallback}
  />
  <input
    type="checkbox"
    value="Pluto"
    // 🟡 Note that the same refCallback is passed to two inputs
    ref={field.at('planets').refCallback}
  />
</form>
```

By default, `uncontrolledPlugin` uses the opinionated element value accessor that applies following coercion rules to
values of form elements:

- Single checkboxes → boolean;
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
[`ElementValueAccessor`](https://smikhalevski.github.io/roqueform/interfaces/Uncontrolled_elements_plugin.ElementValueAccessor.html)
implementation to a plugin. You can use a `createElementValueAccessor` factory to customise the original behaviour:

```ts
import { useField } from 'roqueform';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

const field = useField(
  { dateOfBirth: 316310400000 },
  uncontrolledPlugin(
    createElementValueAccessor({ dateFormat: 'timestamp' })
  )
);
```

<dl>
<dt><code>checkboxFormat = 'auto'</code></dt>
<dd>

The format of checkbox values.

`boolean` A single checkbox is a boolean, multiple checkboxes are an array of booleans.

`booleanArray` An array of booleans.

`value` A single checkbox is a `value` attribute if checked, or `null` if unchecked, multiple checkboxes are an array of
checked values.

`valueArray` An array of `value` attributes.

`auto` A single checkbox is a boolean, multiple checkboxes are an array of checked values.

</dd>

<dt><code>dateFormat = 'value'</code></dt>
<dd>

Customizes the date format read from input elements.

`object` A valid `Date` instance, or `null` if empty.

`timestamp` A timestamp number.

`value` The `value` attribute, or `null` if empty.

`iso` An ISO date string.

`utc` A UTC date string.

`gmt` A GMT date string.

</dd>

<dt><code>timeFormat = 'value'</code></dt>
<dd>

The time format read from input elements.

`number` The number of milliseconds passed from the start of the day.

`value` The <code>value</code> attribute, or <code>null</code> if empty.

</dd>

</dl>
