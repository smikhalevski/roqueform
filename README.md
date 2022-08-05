# Roqueform&ensp;🧀&ensp;[![build](https://github.com/smikhalevski/roqueform/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/roqueform/actions/workflows/master.yml)

The form state management library that can handle hundreds of fields without breaking a sweat.

- Extremely fast, re-renders only updated fields;
- Laconic API with strict typings;
- [Built-in extensibility mechanisms](#plugins);
- [Just 1 kB gzipped](https://bundlephobia.com/result?p=roqueform);
- [Custom validation support](#validation).

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/roqueform-example-2evfif)

```sh
npm install --save-prod roqueform
```

- [Introduction](#introduction)
- [`useField`](#usefield)
    - [Field value updates](#field-value-updates)
    - [Transient updates](#transient-updates)
    - [Field observability](#field-observability)
- [`Field`](#field)
    - [Eager and lazy re-renders](#eager-and-lazy-re-renders)
    - [Reacting to changes](#reacting-to-changes)
- [Plugins](#plugins)
    - [Composing plugins](#composing-plugins)
- [Form submission](#form-submission)
- [Validation](#validation)
- [Accessors](#accessors)

# Introduction

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

The central piece of Roqueform is a `useField` hook that returns a `Field` object that represents a node in a tree of
form input controllers:

```ts
import { useField } from 'roqueform';

const unconstrainedField = useField();
// → Field<any, {}>
```

You can provide an initial value to a field:

```ts
const field = useField({ foo: 'bar' });
// → Field<{ foo: string }, {}>
```

You can derive new fields from the existing ones using `at` method:

```ts
const fooField = field.at('foo');
// → Field<string, {}>
```

`fooField` is a derived field, it is linked to the parent `field`. Fields returned by the `at` method have a stable
identity, so you can invoke `at` with the same key multiple times and the same field instance would be returned:

```ts
field.at('foo') === field.at('foo') // → true
```

Fields can be derived at any depth:

```ts
const field = useField({ foo: [{ bar: 'qux' }] });

field.at('foo').at(0).at('bar');
// → Field<string, {}>
```

## Field value updates

The field is essentially a container that encapsulates the value and provides methods to update it. Let's have a look at
the `dispatchValue` method that updates the field value:

```ts
const field = useField({ foo: 'bar' });

field.getValue();
// → { foo: 'bar' }

field.dispatchValue({ foo: 'qux' });

// The field value was updated
field.getValue();
// → { foo: 'qux' }
```

`useField` doesn't trigger a re-render of the enclosing component. Navigate to
[Field observability](#field-observability) section for more details.

When the parent field is updated using `dispatchValue`, all of the affected derived fields also receive an update:

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

field.getValue();
// → { foo: 'bar' }

fooField.getValue();
// → 'bar'

// Updating the root field
field.dispatchValue({ foo: 'qux' });

// The update was propagated to the derived field
field.getValue();
// → { foo: 'qux' }

fooField.getValue();
// → 'qux'
```

The same is valid for updating derived fields: when the derived field is updated using `dispatchValue`, the update is
propagated to the parent field.

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

// Updating the derived field
fooField.dispatchValue('qux');

// The update was propagated to the parent field
field.getValue();
// → { foo: 'qux' }

fooField.getValue();
// → 'qux'
```

`dispatchValue` has a callback signature:

```ts
fooField.dispatchValue(prevValue => 'qux');
```

## Transient updates

The field update can be done transiently, so the parent won't be notified. You can think about this as a commit in git:
you first stage your changes with `git add` and then commit them with `git commit`.

To achieve this behavior we're going to use `setValue`/`dispatch` instead of `dispatchValue` that we discussed in
[Field value updates](#field-value-updates) section:

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

// Set the transient value, "git add"
fooField.setValue('qux');

// 🟡 Notice that fooField was updated but field wasn't
field.getValue();
// → { foo: 'bar' }

fooField.getValue();
// → 'qux'

// Notify the parent, "git commit"
fooField.dispatch();

// Now both fields are in sync
field.getValue();
// → { foo: 'qux' }

fooField.getValue();
// → 'qux'
```

`setValue` can be called multiple times, but the most recent update would be propagated to the parent only after
`dispatch`/`dispatchValue` call.

You can check that the field has a transient value using `isTransient` method:

```ts
const field = useField({ foo: 'bar' });
const fooField = field.at('foo');

fooField.setValue('qux');

fooField.isTransient();
// → true

fooField.dispatch();

fooField.isTransient();
// → false
```

## Field observability

Fields are observable, you can subscribe to them and receive a callback whenever the field state is updated:

```ts
field.subscribe(targetField => {
  // Handle the update here
});
```

`targetField` is a field that initiated the update, so this can be `field` itself, any of its derived fields, or any of
its ancestors (if `field` is also a derived field).

You can trigger all listeners that are subscribed to the field with `notify`:

```ts
field.notify();
```

# `Field`

The `Field` component subscribes to the given field instance and re-renders its children when the field is updated:

```tsx
import { Field, useField } from 'roqueform';

const App = () => {
  const rootField = useField('foo');

  return (
    <Field field={rootField}>
      {rootField => (
        <input
          value={rootField.getValue()}
          onChange={event => {
            rootField.dispatchValue(event.target.value);
          }}
        />
      )}
    </Field>
  );
};
```

Now, when a user would update the input value, the `rootField` would be updated. The single argument passed to
`children` render function is the field passed as a `field` prop to the `Field` component.

It is unlikely that you would use a form with a single literal field. Most of the time multiple derived fields are
required:

```tsx
const App = () => {
  const rootField = useField({ foo: 'bar', bar: 123 });

  return <>
    <Field field={rootField.at('foo')}>
      {fooField => (
        <input
          type="text"
          value={fooField.getValue()}
          onChange={event => {
            fooField.dispatchValue(event.target.value);
          }}
        />
      )}
    </Field>

    <Field field={rootField.at('bar')}>
      {barField => (
        <input
          type="number"
          value={barField.getValue()}
          onChange={event => {
            barField.dispatchValue(event.target.valueAsNumber);
          }}
        />
      )}
    </Field>
  </>;
};
```

You may have noticed that even though we didn't specify any types yet, our fields are strictly typed. You can check this
by replacing the value dispatched to `barField`:

```diff
- barField.dispatchValue(event.target.valueAsNumber);
+ barField.dispatchValue(event.target.value);
```

This would cause TypeScript to show an error that `barField` value must be of a number type.

## Eager and lazy re-renders

Let's consider the form with two `Field` elements. One of them renders the value of the root field and the other one
updates the derived field:

```tsx
const App = () => {
  const rootField = useField({ bar: 'qux' });

  return <>
    <Field field={rootField}>
      {rootField => JSON.stringify(rootField.getValue())}
    </Field>

    <Field field={rootField.at('bar')}>
      {barField => (
        <input
          type="text"
          value={barField.getValue()}
          onChange={event => {
            barField.dispatchValue(event.target.value);
          }}
        />
      )}
    </Field>
  </>;
};
```

By default, `Form` component re-renders only when the provided field was updated directly, so updates from ancestors or
derived fields would be ignored. Add the `eagerlyUpdated` property to force `Field` to re-render whenever its value was
affected.

```diff
- <Field field={rootField}>
+ <Field
+   field={rootField}
+   eagerlyUpdated={true}
+ >
    {rootField => JSON.stringify(rootField.getValue())}
  </Field>
```

Now both fields are re-rendered when user edits the input text.

## Reacting to changes

[Subscribing to a field](#field-observability) isn't always convenient. Instead, you can use an `onChange` handler that
is triggered only when the field value was updated [non-transiently](#transient-updates).

```tsx
<Field
  field={rootField.at('bar')}
  onChange={value => {
    // Handle the value change
  }}
>
  {barField => (
    <input
      type="text"
      value={barField.getValue()}
      onChange={event => {
        barField.dispatchValue(event.target.value);
      }}
    />
  )}
</Field>
```

# Plugins

Plugins are a very powerful mechanism that allows enriching fields with custom functionality.

Let's enhance the field with the `ref` property that would hold the `RefObject`:

```ts
import { createRef } from 'react';
import { Plugin, useField } from 'roqueform';

const refPlugin: Plugin<any, { ref: RefObject<HTMLInputElement> }> = field => {
  return { ...field, ref: createRef() };
};

const rootField = useField({ bar: 'qux' }, refPlugin);
// → Field<{ bar: string }, { ref: RefObject<HTMLInputElement> }> & { ref: RefObject<HTMLInputElement> }
```

The second argument of the `useField` hook is the plugin function that accepts a field instance and enriches it with
the new functionality. In our case it adds the `ref` to each field derived from the `rootField` and to the `rootField`
itself.

```tsx
<Field field={rootField.at('bar')}>
  {barField => (
    <input
      // 🟡 Notice the ref property
      ref={barField.ref}
      value={barField.getValue()}
      onChange={event => {
        barField.dispatchValue(event.target.value);
      }}
    />
  )}
</Field>
```

After the `Field` mounts we can use ref to imperatively scroll the input element into view:

```ts
rootField.at('bar').ref.current?.scrollIntoView();
```

The `ref` plugin is available as a separate module:

```ts
import { useField } from 'roqueform';
import { refPlugin } from '@roqueform/ref-plugin';

const rootField = useField({ bar: 'qux' }, refPlugin<HTMLInputElement>());
// → Field<{ bar: string }, RefPlugin<HTMLInputElement>> & RefPlugin<HTMLInputElement>
```

## Composing plugins

You may want to use multiple plugins at the same time, but `useField` allows passing only one plugin function. To
combine multiple plugins into one, use `applyPlugins` helper function:

```ts
import { applyPlugins, useField } from 'roqueform';
import { refPlugin } from '@roqueform/ref-plugin';

const field = useField({ bar: 'qux' }, applyPlugins(refPlugin(), anotherPlugin));
```

# Form submission

Without plugins, Roqueform only manages the state of the form fields, and doesn't affect how the form is submitted. So
you can use `form` tags as you did before, but read input values from the `Field` object:

```tsx
const App = () => {
  const rootField = useField({ bar: 'foo' });

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    // The form value to submit
    const value = rootField.getValue();
  };

  return (
    <form onSubmit={handleSubmit}>

      <Field field={rootField.at('bar')}>
        {barField => (
          <input
            value={barField.getValue()}
            onChange={event => {
              barField.dispatchValue(event.target.value);
            }}
          />
        )}
      </Field>

      <button type="submit">
        {'Submit'}
      </button>

    </form>
  );
};
```

You can always [create a plugin](#plugins) that would enhance the `Field` with custom submit mechanics.

# Validation

Roqueform isn't tied to any validation library. You can use an existing plugin, or write your own to extend Roqueform
with validation provided by an arbitrary library.

Currently, the only available validation plugin [@roqueform/doubter-plugin](./packages/doubter-plugin#readme) which
uses [Doubter](https://github.com/smikhalevski/doubter#readme) under-the-hood.

```ts
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import * as d from 'doubter';

const valueType = d.object({
  bar: d.string().min(5)
});

const rootField = useField({ bar: 'qux' }, doubterPlugin(valueType));

rootField.validate();

rootField.at('bar').getIssue();
// → { message: 'Must have the minimum length of 5', … }
```

[Plugin usage details can be found here.](./packages/doubter-plugin#readme)

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
