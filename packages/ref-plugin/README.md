# DOM reference plugin for Roqueform

Associates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with DOM elements.

```sh
npm install --save-prod @roqueform/ref-plugin
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_ref_plugin.html)

This plugin doesn't require any rendering framework. To simplify the usage example, we're going to use
[the React integration](../react).

```tsx
import { useEffect } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';
import { refPlugin } from '@roqueform/ref-plugin';

export const App = () => {
  const planetField = useField({ name: 'Venus' }, refPlugin());

  return (
    <FieldRenderer field={planetField.at('name')}>
      {nameField => (
        <input
          ref={nameField.ref}
          value={nameField.value}
          onChange={event => {
            nameField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>
  );
};
```

Access an element referenced by a field:

```ts
planetField.at('name').element // ⮕ HTMLInputElement
```

Focus and blur an element referenced by a field. If a field doesn't have an associated element this is a no-op.

```ts
planetField.at('name').focus();

planetField.at('name').isFocused // ⮕ true
```

Scroll to an element:

```ts
planetField.at('name').scrollIntoView({ behavior: 'smooth' });
```
