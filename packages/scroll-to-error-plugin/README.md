# Scroll to an error plugin for Roqueform

[Roqueform](https://github.com/smikhalevski/roqueform#readme) plugin that enables scrolling to a field that has an
associated validation error.

```sh
npm install --save-prod @roqueform/scroll-to-error-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_scroll_to_error_plugin.html)

This plugin works in conjunction with [a validation plugin](../../#plugins-and-integrations). If an element associated
with the field is displayed and an `error` isn't `null` than `scrollToError()` would scroll the viewport, so the element
is reveled on the screen.

The example below uses [Doubter](https://github.com/smikhalevski/doubter#readme) shapes and
[Doubter plugin](../doubter-plugin#readme) for validation.

```tsx
import { SyntheticEvent, useEffect } from 'react';
import { composePlugins } from 'roqueform';
import { FieldRenderer, useField } from '@roqueform/react';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import { scrollToErrorPlugin } from '@roqueform/scroll-to-error-plugin';
import * as d from 'doubter';

const planetShape = d.object({
  name: d.string().min(1),
});

export const App = () => {
  const planetField = useField(
    { name: '' },
    composePlugins(
      doubterPlugin(planetShape),
      scrollToErrorPlugin()
    )
  );

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (planetField.validate()) {
      // Scroll to the error that is closest to the top left conrner of the document 
      planetField.scrollToError(0, { behavior: 'smooth' });
      return;
    }

    // The form value to submit
    planetField.value;
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={planetField.at('name')}>
        {nameField => (
          <>
            <input
              // 🟡 Note that the input element ref is populated
              ref={nameField.refCallback}
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
