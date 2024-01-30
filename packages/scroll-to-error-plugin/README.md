# Scroll to an error plugin for Roqueform

[Roqueform](https://github.com/smikhalevski/roqueform#readme) plugin that enables scrolling to a field that has an
associated validation error.

```sh
npm install --save-prod @roqueform/scroll-to-error-plugin
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/scroll_to_error_plugin.html)

This plugin works best in conjunction with the [`errorsPlugin`](../../#validation-scaffolding) or any of the
[validation plugins](../../#plugins-and-integrations). If an element associated with the field via
[`ref`](https://smikhalevski.github.io/roqueform/interfaces/scroll_to_error_plugin.ScrollToErrorPlugin.html#ref) is
displayed and an the field is invalid than `scrollToError()` would scroll the viewport, so the element is reveled on the
screen.

This plugin doesn't require any rendering framework. To simplify the usage example, we're going to use
[the React integration](../react#readme).

```tsx
import { SyntheticEvent, useEffect } from 'react';
import { composePlugins, errorsPlugin } from 'roqueform';
import { FieldRenderer, useField } from '@roqueform/react';
import { scrollToErrorPlugin } from '@roqueform/scroll-to-error-plugin';

export const App = () => {
  const planetField = useField(
    { name: 'Mars' },
    composePlugins(
      errorsPlugin(),
      scrollToErrorPlugin()
    )
  );

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    if (planetField.getInvalidFields().length === 0) {
      // Submit the valid form value.
      doSubmit(planetField.value);
    } else {
      // Scroll to the invalid field that is closest to the top left conrner of the document.
      planetField.scrollToError(0, { behavior: 'smooth' });
    }
  };

  useEffect(() => {
    // Mark field as invalid.
    planetField.at('name').addError('Too far away');
  }, []);
  
  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={planetField.at('name')}>
        {nameField => (
          <>
            <input
              // 🟡 Note that the input element ref is populated.
              ref={nameField.ref}
              value={nameField.value}
              onChange={event => {
                nameField.setValue(event.target.value);
              }}
            />
            {nameField.errors}
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
