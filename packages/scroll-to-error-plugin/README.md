# Scroll to an error plugin for Roqueform

[Roqueform](https://github.com/smikhalevski/roqueform#readme) plugin that enables scrolling to a field that has an
associated validation error.

```sh
npm install --save-prod @roqueform/scroll-to-error-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_scroll_to_error_plugin.html)

Scroll plugin assumes that the field is enhanced with `ref` and `error` properties. The `ref` property should be a Rect
reference object that points to the `Element`, and `error` holds a validation error. If an element is displayed and an
error is defined and not `null` than `scrollToError()` would reveal this element on the screen.

```tsx
import { useEffect } from 'react';
import { FieldRenderer, useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import { refPlugin } from '@roqueform/ref-plugin';
import { scrollToErrorPlugin } from '@roqueform/scroll-to-error-plugin';
import * as d from 'doubter';

// Define a runtime type using Doubter
const valueShape = d.object({
  bar: d.string().min(1),
});

export const App = () => {
  const rootField = useField(
    { bar: 'qux' },
    applyPlugins(
      refPlugin(),
      doubterPlugin(valueShape),
      scrollToErrorPlugin()
    )
  );

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();
    
    if (rootField.validate()) {
      // Scroll to the error that is closest to the top left conrner of the document 
      rootField.scrollToError(0, { behavior: 'smooth' });
      return;
    }

    // The form value to submit
    rootField.value;
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={rootField.at('bar')}>
        {barField => (
          <>
            <input
              // 🟡 Note that the input element ref is populated
              ref={barField.refCallback}
              value={barField.value}
              onChange={event => {
                barField.setValue(event.target.value);
              }}
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
