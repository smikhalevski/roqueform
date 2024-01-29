# React integration for Roqueform

Hooks and components to integrate [Roqueform](https://github.com/smikhalevski/roqueform#readme) with React.

```sh
npm install --save-prod @roqueform/react
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/react.html)

[`useField`](https://smikhalevski.github.io/roqueform/functions/react.useField.html) hook has the same signature as the 
[`createField`](https://smikhalevski.github.io/roqueform/functions/roqueform.createField.html) function:

```tsx
import type { SyntheticEvent } from 'react';
import { FieldRenderer, useField } from '@roqueform/react';

export const App = () => {
  const planetField = useField({ name: 'Mars' });

  const handleSubmit = (event: SyntheticEvent) => {
    event.preventDefault();

    // Submit the field value
    doSubmit(planetField.value);
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={planetField.at('name')}>
        {nameField => (
          <input
            type="text"
            value={nameField.value}
            onChange={event => {
              nameField.setValue(event.target.value);
            }}
          />
        )}
      </FieldRenderer>

      <button type="submit">
        {'Submit'}
      </button>

    </form>
  );
};
```

`useField` hook returns a [`Field`](https://smikhalevski.github.io/roqueform/types/roqueform.Field.html) instance that
is preserved between re-renders.

```ts
useField();
// ⮕ Field
```

You can provide the initial value for a field.

```ts
useField({ planet: 'Mars' });
// ⮕ Field<unknown, { planet: string }>
```

If you pass a callback as an initial value, it would be invoked when the field is initialized.

```ts
useField(() => getInitialValue());
```

Pass [a plugin](../../#plugins-and-integrations) as the second argument of the `useField` hook.

```ts
import { useField } from '@roqueform/react';
import { errorsPlugin } from 'roqueform';

const planetField = useField({ planet: 'Pluto' }, errorsPlugin());

planetField.addError('Too far away');
```

The `FieldRenderer` component subscribes to the given field instance and re-renders children when an event is dispatched
onto the field:

```tsx
import { FieldRenderer, useField } from '@roqueform/react';

const App = () => {
  const planetField = useField({ name: 'Mars' });

  return (
    <FieldRenderer field={planetField.at('name')}>
      {nameField => (
        <input
          type="text"
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

When a user updates the input value, the `nameField` is updated and `FieldRenderer` component is re-rendered. The single
argument of the `children` render function is the field passed as a `field` prop to the `FieldRenderer` component.

# Eager and lazy re-renders

Let's consider the form with two `FieldRenderer` elements. One of them renders the value of the root field and the other
one renders an input that updates the child field:

```tsx
const App = () => {
  const planetField = useField({ name: 'Mars' });

  return <>
    <FieldRenderer field={planetField}>
      {() => JSON.stringify(planetField.value)}
    </FieldRenderer>

    <FieldRenderer field={planetField.at('name')}>
      {nameField => (
        <input
          type="text"
          value={nameField.value}
          onChange={event => {
            nameField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>
  </>;
};
```

By default, `FieldRenderer` component re-renders only when the provided field was updated directly, so updates from
ancestors or child fields would be ignored. Add the `eagerlyUpdated` property to force `FieldRenderer` to re-render
whenever its value was affected.

```diff
- <FieldRenderer field={planetField}>
+ <FieldRenderer
+   field={planetField}
+   eagerlyUpdated={true}
+ >
    {() => JSON.stringify(planetField.value)}
  </FieldRenderer>
```

Now both fields are re-rendered when user edits the input text.

# Reacting to changes

You can use an `onChange` handler that is triggered only when the field value was updated
[non-transiently](../../#transient-updates).

```tsx
<FieldRenderer
  field={planetField.at('name')}
  onChange={value => {
    // Handle the non-transient name changes
  }}
>
  {nameField => (
    <input
      type="text"
      value={nameField.value}
      onChange={event => {
        nameField.setValue(event.target.value);
      }}
    />
  )}
</FieldRenderer>
```
