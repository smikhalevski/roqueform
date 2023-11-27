# Annotations plugin for Roqueform

Manages [Roqueform](https://github.com/smikhalevski/roqueform#readme) field annotations.

```sh
npm install --save-prod @roqueform/annotations-plugin
```

# Usage example

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/_roqueform_annotations_plugin.html)

Annotations allow to associate arbitrary data with fields.

```tsx
import { FieldRenderer, useField } from '@roqueform/react';
import { annotationsPlugin } from '@roqueform/annotations-plugin';

export const App = () => {
  const planetField = useField(
    { name: 'Pluto' },
    annotationsPlugin({ isDisabled: false })
  );
  
  const handleSubmit = () => {
    // Disable interface before submit
    planetField.annotate({ isDisabled: true }, { recursive: true });
    
    doSubmit(planetField.value).then(() => {
      // Enable interface after submit is completed
      planetField.annotate({ isDisabled: false }, { recursive: true });
    });
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={planetField.at('name')}>
        {nameField => (
          <input
            disabled={nameField.annotations.isDisabled}
            value={nameField.value}
            onChange={event => {
              nameField.setValue(event.target.value);
            }}
          />
        )}
      </FieldRenderer>

      <FieldRenderer field={planetField}>
        {() => (
          <button
            type="submit"
            disabled={planetField.annotations.isDisabled}
          >
            {'Submit'}
          </button>
        )}
      </FieldRenderer>

    </form>
  );
};
```
