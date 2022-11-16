# Scroll to an error plugin for Roqueform

[Roqueform](https://github.com/smikhalevski/roqueform#readme) plugin that enables scrolling to a field that has an
associated validation error.

```sh
npm install --save-prod @roqueform/scroll-to-error-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/scroll_to_error_plugin_src_main.html)

```tsx
import { useEffect } from 'react';
import { useField } from 'roqueform';
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
    scrollToErrorPlugin(applyPlugins(
      refPlugin(),
      doubterPlugin(valueShape)
    ))
  );

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    // Trigger validation
    rootField.validate();

    if (rootField.invalid) {
      // Scroll to the error that is closest to the top left conrner of the document 
      rootField.scrollToError(0, { behavior: 'smooth' });
      return;
    }

    // The form value to submit
    const value = rootField.value;
  };

  return (
    <form onSubmit={handleSubmit}>

      <Field field={rootField.at('bar')}>
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
      </Field>

      <button type="submit">
        {'Submit'}
      </button>

    </form>
  );
};
```
