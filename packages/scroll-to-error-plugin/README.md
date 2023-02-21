# Scroll to an error plugin for Roqueform

[Roqueform](https://github.com/smikhalevski/roqueform#readme) plugin that enables scrolling to a field that has an
associated validation error.

```sh
npm install --save-prod @roqueform/scroll-to-error-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/scroll_to_error_plugin.html)

This plugin works in conjunction with [a validation plugin](../../#plugins-and-integrations). If an element is displayed
and an error not `null` than `scrollToError()` would reveal this element on the screen.

The example below uses [Doubter](https://github.com/smikhalevski/doubter#readme) shapes and
[Doubter plugin](../doubter-plugin#readme).

```tsx
import { SyntheticEvent, useEffect } from 'react';
import { applyPlugins } from 'roqueform';
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
    applyPlugins(
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
