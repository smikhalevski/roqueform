# Annotations plugin for Roqueform

Manages [Roqueform](https://github.com/smikhalevski/roqueform#readme) field annotations.

```sh
npm install --save-prod @roqueform/annotations-plugin
```

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/annotations_plugin.html)

Annotations allow to associate arbitrary data with fields.

```ts
import { createField } from 'roqueform';
import { annotationsPlugin } from '@roqueform/annotations-plugin';

const field = createField(
  { name: 'Pluto' },
  annotationsPlugin({ isDisabled: false })
);

field.at('name').isDisabled; // ⮕ false
```

Update annotations for a single field:

```ts
field.annotate({ isDisabled: true });

field.isDisabled; // ⮕ true

field.at('name').isDisabled; // ⮕ false
```

Annotate field and all of its children recursively:

```ts
field.annotate({ isDisabled: true }, { recursive: true });

field.isDisabled; // ⮕ true

// 🌕 The child field was annotated along with its parent
field.at('name').isDisabled; // ⮕ true
```

Annotations can be updated using a callback. This is especially useful in conjunction with recursive flag:

```ts
field.annotate(
  field => {
    // Toggle disabled flag for the field and its children
    return { isDisabled: !field.annotations.isDisabled };
  },
  { recursive: true }
);
```

Subscribe to annotation changes:

```ts
field.subscribe('change:annotations', event => {
  event.target.annotations;
  // ⮕ { isDisabled: boolean }
});
```
