# Constraint validation API plugin for Roqueform

Integrates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with
[Constraint validation API.](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation)

```sh
npm install --save-prod @roqueform/constraint-validation-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_constraint_validation_plugin.html)

```tsx
import { useEffect } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';
import { constraintValidationPlugin } from '@roqueform/constraint-validation-plugin';

export const App = () => {
  const planetField = useField({ name: 'Mars' }, constraintValidationPlugin());

  useEffect(() => {
    planetField.reportValidity();
  }, []);

  return (
    <FieldRenderer field={planetField.at('name')}>
      {nameField => (
        <input
          type="text"
          pattern="Venus"
          ref={nameField.refCallback}
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
