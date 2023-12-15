# Constraint validation API plugin for Roqueform

Integrates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with the
[Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).

```sh
npm install --save-prod @roqueform/constraint-validation-plugin
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/constraint_validation_plugin.html)

This plugin doesn't require any rendering framework. It subscribes to events that are dispatched by a DOM element passed
to the [`ref`](https://smikhalevski.github.io/roqueform/interfaces/constraint_validation_plugin.ConstraintValidationPlugin.html#ref)
method. To simplify the usage example, we're going to use [the React integration](../react#readme).

```tsx
import { useEffect } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';
import { constraintValidationPlugin } from '@roqueform/constraint-validation-plugin';

export const App = () => {
  const planetField = useField(
    { name: 'Mars' },
    constraintValidationPlugin()
  );

  return (
    <FieldRenderer field={planetField.at('name')}>
      {nameField => (
        <>
          <input
            type="text"
            pattern="Venus"
            // 🟡 Note that the input element ref is populated.
            ref={nameField.ref}
            value={nameField.value}
            onChange={event => {
              nameField.setValue(event.target.value);
            }}
            aria-invalid={nameField.isInvalid}
          />
          {nameField.validatedElement?.validationMessage}
        </>
      )}
    </FieldRenderer>
  );
};
```

Get the array of all invalid fields:

```ts
planetField.getInvalidFields();
// ⮕ [planetField.at('name')]
```

Show an error message balloon for the first invalid element that is associated with this field or any of its child
fields:

```ts
planetField.reportValidity();
```

Subscribe to the field validity changes:

```ts
planetField.on('change:validity', event => {
  event.target.validity;
  // ⮕ ValidityState
});
```
