# Annotations plugin for Roqueform

Manages [Roqueform](https://github.com/smikhalevski/roqueform#readme) field annotations.

```sh
npm install --save-prod @roqueform/annotations-plugin
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/annotations_plugin.html)

Annotations allow to associate arbitrary data with fields.

```ts
import { createField } from 'roqueform';
import { annotationsPlugin } from '@roqueform/annotations-plugin';

const planetField = createField(
  { name: 'Pluto' },
  annotationsPlugin({ isDisabled: false })
);

planetField.at('name').annotations.isDisabled // ⮕ false
```

Update annotations for a single field:

```ts
planetField.annotate({ isDisabled: true });

planetField.annotations.isDisabled // ⮕ true

planetField.at('name').annotations.isDisabled // ⮕ false
```

Annotate field and all of its children recursively:

```ts
planetField.annotate({ isDisabled: true }, { recursive: true });

planetField.annotations.isDisabled // ⮕ true

// 🌕 The child field was annotated along with its parent
planetField.at('name').annotations.isDisabled // ⮕ true
```

Annotations can be updated using a callback. This is especially useful in conjunction with recursive flag:

```ts
planetField.annotate(
  field => {
    // Toggle disabled flag for the field and its children
    return { isDisabled: !field.annotations.isDisabled };
  },
  { recursive: true }
);
```

Subscribe to annotation changes:

```ts
planetField.subscribe('change:annotations', event => {
  event.target.annotations;
  // ⮕ { isDisabled: boolean }
});
```
