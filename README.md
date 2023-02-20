<p align="center">
  <a href="#readme">
    <img src="./images/logo.png" alt="Roqueform" width="500"/>
  </a>
</p>

The form state management library that can handle hundreds of fields without breaking a sweat.

- Extremely fast, re-renders only updated fields;
- Expressive and concise API with strict typings;
- Controlled and uncontrolled inputs;
- Not tied to any rendering library; 
- [Works with any validation library;](#validation)
- [Extensible with plugins;](#plugins)
- [Just 2 kB gzipped.](https://bundlephobia.com/result?p=roqueform)

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/roqueform-example-2evfif)

```sh
npm install --save-prod roqueform
```

# Basics

The central piece of Roqueform is the concept of a field. A field holds a value and provides a couple of ways to update
it. Fields can be enhanced by plugins that provide such things as integration with rendering and validation libraries.

Let's start by creating a filed:

```ts
import { createField } from 'roqueform';

const field = createField();
// ⮕ Field<any>
```

A value can be set to and retrieved from the field:

```ts
field.setValue('Pluto');

field.value;
// ⮕ 'Pluto'
```

Provide the initial value for a field:

```ts
const ageField = createField(42);

ageField.value;
// ⮕ 42
```

Derive a new field from the existing one:

```ts
const universeField = createField();

const planetsField = universeField.at('planets');
```

`planetsField` is a derived field, and it is linked to its parent `universeField`.

```ts
planetsField.key;
// ⮕ 'planets'

planetsField.parent;
// ⮕ universeField
```

Fields returned by the `at` method have a stable identity. This means that you can invoke `at` with the same key
multiple times and the same field instance would be returned:

```ts
universeField.at('planets');
// ⮕ planetsField
```

Most of the time you don't need to store a reference to a derived field in a variable if you already have a reference
to a parent field.

The derived field has all the same functionality as its parent, so you can derive a new field from it as well:

```ts
planetsField.at(0).at('name');
```

When a value is set to a derived field, a parent field value is also updated. Roqueform would infer the type of the
parent field value depending on the derived field key.

```ts
universeField.at('planets').at(0).at('name').setValue('Mars')

universeField.value;
// ⮕ { planets: [{ name: 'Mars' }] }
```

By default, for a string key a parent object is created, and for number key a parent array is created. You can change
this behaviour with [Accessors](#accessors).

# Transient updates

When a derived field is updated transiently, the value of its parent isn't updated.

```ts
const avatarField = createField();

avatarField.at('eyeColor').setTransientValue('green');

avatarField.at('eyeColor').value;
// ⮕ 'green'

avatarField.value;
// ⮕ undefined
```

To propagate the value of the transiently updated derived field to the parent, use `dispatch`:

```ts
avatarField.at('eyeColor').dispatch();

avatarField.value;
// ⮕ { eyeColor: 'green' }
```

`setTransientValue` can be called multiple times, but only the most recent update would be propagated to the parent
field after the `dispatch` call.















Subscribe to a field to receive a notification when a field is changed

Fields are updated synchronouly



















- [Foreword](#foreword)
- [`useField`](#usefield)
    - [Field value updates](#field-value-updates)
    - [Transient updates](#transient-updates)
    - [Field observability](#field-observability)
- [`FieldRenderer`](#fieldrenderer)
    - [Eager and lazy re-renders](#eager-and-lazy-re-renders)
    - [Reacting to changes](#reacting-to-changes)
- [Plugins](#plugins)
    - [Authoring a plugin](#authoring-a-plugin)
    - [Composing plugins](#composing-plugins)
- [Form submission](#form-submission)
- [Validation](#validation)
    - [Validation scaffolding plugin](#validation-scaffolding-plugin)
- [Accessors](#accessors)

# Foreword

Form lifecycle consists of four separate phases: Input, Validate, Display errors, and Submit. These phases can be
represented as non-intersecting processes. The result obtained during one phase may be used as an input for another
phase. For example, let's consider the following set of actions:

- The user inputs form values;
- The input is validated;
- Validation errors are displayed;
- Input is submitted;
- Errors received from the backend are displayed.

These actions are non-intersecting and can happen in an arbitrary order, or even in parallel. The form management
library should allow to tap in (or at least not constrain the ability to do so) at any particular phase to tweak the
data flow.

So the Roqueform was built to satisfy the following requirements:

- No excessive re-renders of unchanged fields.

- Everything should be statically and strictly typed up to the very field value setter. So there must be a compilation
  error if the string value from the silly input is assigned to the number-typed value in the form state object.

- **Use the platform!** The form state management library must not constrain the use of the `form` submit behavior,
  browser-based validation, and other related browser-native features.

- There should be no restrictions on how and when the form input is submitted because data submission is generally
  an application-specific process.

- There are many approaches to validation, and a great number of awesome validation libraries. The form library must
  be agnostic to where (client-side, server-side, or both), how (on a field or on a form level), and when (sync, or
  async) the validation is handled.

- Validation errors aren't standardized, so an arbitrary error object shape must be allowed and related typings must be
  seamlessly propagated to the error consumers/renderers.

- The library API must be simple.

# `useField`

The central piece of Roqueform is a `useField` hook that returns a
[`Field`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Field.html) object that represents a node in a
tree of form input controllers:

```ts
import { useField } from 'roqueform';

const field = useField();
// ⮕ Field<any>
```

You can provide an initial value to a field (a field value type would is automatically inferred):

```ts
const field = useField({ foo: 'bar' });
// ⮕ Field<{ foo: string }>
```

## Field value updates

The field is essentially a container that encapsulates the value and provides methods to update it. Let's have a look at
the `setValue` method that updates the field value:

```ts
const field = useField({ foo: 'bar' });

field.value;
// ⮕ { foo: 'bar' }

field.setValue({ foo: 'qux' });

// 🟡 The field value was updated
field.value;
// ⮕ { foo: 'qux' }
```

`useField` doesn't trigger re-renders of the enclosing component. Navigate to
[Field observability](#field-observability) section for more details.

When the parent field is updated using `setValue`, all of the affected derived fields also receive an update:

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

field.value;
// ⮕ { foo: 'bar' }

fooField.value;
// ⮕ 'bar'

// Updating the root field
field.setValue({ foo: 'qux' });

// 🟡 The update was propagated to the derived field
field.value;
// ⮕ { foo: 'qux' }

fooField.value;
// ⮕ 'qux'
```

The same is valid for updating derived fields: when the derived field is updated using `setValue`, the update is
propagated to the parent field.

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

// Updating the derived field
fooField.setValue('qux');

// The update was propagated to the parent field
field.value;
// ⮕ { foo: 'qux' }

fooField.value;
// ⮕ 'qux'
```

`setValue` also has a callback signature:

```ts
fooField.setValue(prevValue => 'qux');
```

## Transient updates

The field update can be done transiently, so the parent won't be notified. You can think about this as a commit in git:
you first stage your changes with `git add` and then commit them with `git commit`.

To achieve this behavior we're going to use `setTransientValue`/`dispatch` instead of `setValue` that we discussed in
[Field value updates](#field-value-updates) section:

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

// Set the transient value, "git add"
fooField.setTransientValue('qux');

field.value;
// ⮕ { foo: 'bar' }

// 🟡 Notice that fooField was updated but field wasn't
fooField.value;
// ⮕ 'qux'

// Notify the parent, "git commit"
fooField.dispatch();

// Now both fields are in sync
field.value;
// ⮕ { foo: 'qux' }

fooField.value;
// ⮕ 'qux'
```

`setTransientValue` can be called multiple times, but the most recent update would be propagated to the parent only
after the `dispatch` call.

You can check that the field has a transient value using `transient` property:

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

fooField.setTransientValue('qux');

fooField.transient;
// ⮕ true

fooField.dispatch();

fooField.transient;
// ⮕ false
```

## Field observability

Fields are observable, you can subscribe to them and receive a callback whenever the field state is updated:

```ts
field.subscribe((targetField, currentField) => {
  // Handle the update here
});
```

`targetField` is a field that initiated the update, so this can be the `field` itself, any of its derived fields, or any
of its ancestors (if `field` is also a derived field).

`currentField` is the field to which the listener is subscribed, so in this case it is `field`.

# `FieldRenderer`

The `FieldRenderer` component subscribes to the given field instance and re-renders its children when the field is
notified:

```tsx
import { FieldRenderer, useField } from 'roqueform';

const App = () => {
  const rootField = useField('foo');

  return (
    <FieldRenderer field={rootField}>
      {rootField => (
        <input
          value={rootField.value}
          onChange={event => {
            rootField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>
  );
};
```

When a user updates the input value, the `rootField` is updated and `FieldRenderer` component is re-rendered. The single
argument of the `children` render function is the field passed as a `field` prop to the `FieldRenderer` component.

It is unlikely that you would use a form with a single literal field. Most of the time multiple derived fields are
required:

```tsx
const App = () => {
  const rootField = useField({ foo: 'qux', bar: 123 });

  return <>
    <FieldRenderer field={rootField.at('foo')}>
      {fooField => (
        <input
          type="text"
          value={fooField.value}
          onChange={event => {
            fooField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>

    <FieldRenderer field={rootField.at('bar')}>
      {barField => (
        <input
          type="number"
          value={barField.value}
          onChange={event => {
            barField.setValue(event.target.valueAsNumber);
          }}
        />
      )}
    </FieldRenderer>
  </>;
};
```

You may have noticed that even though we didn't specify any types yet, our fields are strictly typed. You can check this
by replacing the value dispatched to `barField`:

```diff
- barField.setValue(event.target.valueAsNumber);
+ barField.setValue(event.target.value);
```

This would cause TypeScript to show an error that `barField` value must be of a number type.

## Eager and lazy re-renders

Let's consider the form with two `FieldRenderer` elements. One of them renders the value of the root field and the other
one renders an input that updates the derived field:

```tsx
const App = () => {
  const rootField = useField({ bar: 'qux' });

  return <>
    <FieldRenderer field={rootField}>
      {rootField => JSON.stringify(rootField.value)}
    </FieldRenderer>

    <FieldRenderer field={rootField.at('bar')}>
      {barField => (
        <input
          type="text"
          value={barField.value}
          onChange={event => {
            barField.setValue(event.target.value);
          }}
        />
      )}
    </FieldRenderer>
  </>;
};
```

By default, `FieldRenderer` component re-renders only when the provided field was updated directly, so updates from
ancestors or derived fields would be ignored. Add the `eagerlyUpdated` property to force `FieldRenderer` to re-render
whenever its value was affected.

```diff
- <FieldRenderer field={rootField}>
+ <FieldRenderer
+   field={rootField}
+   eagerlyUpdated={true}
+ >
    {rootField => JSON.stringify(rootField.value)}
  </FieldRenderer>
```

Now both fields are re-rendered when user edits the input text.

## Reacting to changes

[Subscribing to a field](#field-observability) isn't always convenient. Instead, you can use an `onChange` handler that
is triggered only when the field value was updated [non-transiently](#transient-updates).

```tsx
<FieldRenderer
  field={rootField.at('bar')}
  onChange={value => {
    // Handle the value change
  }}
>
  {barField => (
    <input
      type="text"
      value={barField.value}
      onChange={event => {
        barField.setValue(event.target.value);
      }}
    />
  )}
</FieldRenderer>
```

# Plugins

Plugins are a very powerful mechanism that allows enriching fields with a custom functionality.

There's a set of plugins available in this repo:

- [@roqueform/doubter-plugin](./packages/doubter-plugin#readme)<br>
  Enhances fields with validation methods powered by [Doubter](https://github.com/smikhalevski/doubter#readme).

- [@roqueform/ref-plugin](./packages/ref-plugin#readme)<br>
  Enhances fields with DOM-related methods.

- [@roqueform/reset-plugin](./packages/reset-plugin#readme)<br>
  Enhances fields with methods that manage the initial value.

- [@roqueform/scroll-to-error-plugin](./packages/scroll-to-error-plugin#readme)<br>
  Enables scrolling to a field that has an associated validation error.

## Authoring a plugin

Let's enhance the field with the `ref` property that would hold the `RefObject`:

```ts
import { createRef, RefObject } from 'react';
import { Plugin, useField } from 'roqueform';

function refPlugin(): Plugin<{ ref: RefObject<HTMLInputElement> }> {
  return field => {
    Object.assign(field, { ref: createRef() });
  };
}

const rootField = useField({ bar: 'qux' }, refPlugin());
// ⮕ Field<{ bar: string }, { ref: RefObject<HTMLInputElement> }> & { ref: RefObject<HTMLInputElement> }
```

The second argument of the `useField` hook is the plugin function that accepts a field instance and enriches it with
the new functionality. In our case it adds the `ref` to each field derived from the `rootField` and to the `rootField`
itself.

```tsx
<FieldRenderer field={rootField.at('bar')}>
  {barField => (
    <input
      // 🟡 Notice the ref property
      ref={barField.ref}
      value={barField.value}
      onChange={event => {
        barField.setValue(event.target.value);
      }}
    />
  )}
</FieldRenderer>
```

After the `FieldRenderer` is mounted we can use ref to imperatively scroll the input element into view:

```ts
rootField.at('bar').ref.current?.scrollIntoView();
```

## Composing plugins

To combine multiple plugins into one, use `applyPlugins` helper function:

```ts
import { applyPlugins, useField } from 'roqueform';
import { refPlugin } from '@roqueform/ref-plugin';

const field = useField({ bar: 'qux' }, applyPlugins(refPlugin(), anotherPlugin()));
```

# Form submission

Without plugins, Roqueform only manages the state of the form fields, and doesn't affect how the form is submitted. So
you can use `form` tags and read input values from the `Field` object:

```tsx
const App = () => {
  const rootField = useField({ bar: 'foo' });

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    // The form value to submit
    rootField.value;
  };

  return (
    <form onSubmit={handleSubmit}>

      <FieldRenderer field={rootField.at('bar')}>
        {barField => (
          <input
            value={barField.value}
            onChange={event => {
              barField.setValue(event.target.value);
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

You can always [create a plugin](#plugins) that would enhance the `Field` instance with custom submit mechanics.

# Validation

Roqueform isn't tied to any validation library. You can use an existing plugin, or write your own to extend Roqueform
with validation provided by an arbitrary library.

Consider using [@roqueform/doubter-plugin](./packages/doubter-plugin#readme) which relies on
[Doubter](https://github.com/smikhalevski/doubter#readme) under-the-hood.

```ts
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

const valueShape = d.object({
  bar: d.string().min(5)
});

const rootField = useField({ bar: 'qux' }, doubterPlugin(valueShape));

rootField.validate();
// ⮕ [{ message'Must have the minimum length of 5', … }]

rootField.at('bar').error;
// ⮕ { message: 'Must have the minimum length of 5', … }
```

[Plugin usage details can be found here.](./packages/doubter-plugin#readme)

## Validation scaffolding plugin

Roqueform a shipped with validation scaffolding plugin `validatePlugin`, so you can build your validation on top of it.

```ts
import { Plugin, useField, validationPlugin, ValidationMixin } from 'roqueform';

const plugin = validationPlugin((field, setInternalError, options) => {
  if (field.at('foo').value === null) {
    setInternalError(field.at('foo'), 'Must not be null');
  }
});

const field = useField({ foo: 'bar' }, plugin);

// Manually set an error for a field
field.setError('Some useful message');

field.error;
// ⮕ 'Some useful message'

field.at('foo').error;
// ⮕ 'Must not be null'

// Clear all errors of the field and its derived fields
field.clearErrors();
```

This plugin makes all the heavy lifting related to field updates, manual validation error management, async validation
abortions, etc. It takes a validator callback or an object that has a `validate` method and an optional `validateAsync`
method. The validator receives a field that must be validated and a `setInternalError` callback that to notifies
Roqueform that an error should be assigned to a particular field.

`validatePlugin` distinguishes internal errors (those set via `setInternalError`) and external errors (those set via
`field.setError`). Internal errors are automatically cleared when the `field.validate` or `field.validateAsync`
methods are called. External errors are preserved as is, and you should explicitly call `field.clearErrors` before
validation to delete them.

# Accessors

When you derive a new field or update a derived field, Roqueform uses an accessor to read and write a value to the
parent field. You can alter the way field values are read and written by providing a custom implementation of `Accessor`
interface to `AccessorContext`.

```tsx
import { objectAccessor, AccessorContext } from 'roqueform';

<AccessorContext.Provider value={objectAccessor}>
  {/* useField should go here */}
</AccessorContext.Provider>
```
