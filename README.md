<p align="center">
  <a href="#readme">
    <img src="./images/logo.png" alt="Roqueform" width="500"/>
  </a>
</p>

The form state management library that can handle hundreds of fields without breaking a sweat.

- Expressive and concise API with strict typings;
- Controlled and uncontrolled inputs;
- [Unparalleled extensibility with plugins;](#plugins-and-integrations)
- Supports your favourite rendering and [validation libraries;](#validation-scaffolding-plugin)
- [Just 2 kB gzipped.](https://bundlephobia.com/result?p=roqueform)

🔥&ensp;[**Try it on CodeSandbox**](https://codesandbox.io/s/2evfif)

```sh
npm install --save-prod roqueform
```

- [Plugins and integrations](#plugins-and-integrations)
- [Basics](#basics)
- [Transient updates](#transient-updates)
- [Accessors](#accessors)
- [Authoring a plugin](#authoring-a-plugin)
- [Composing plugins](#composing-plugins)
- [Validation scaffolding plugin](#validation-scaffolding-plugin)
- [Motivation](#motivation)

# Plugins and integrations

- [constraint-validation-plugin](./packages/constraint-validation-plugin#readme)<br/>
  Integrates fields with
  [Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).

- [doubter-plugin](./packages/doubter-plugin#readme)<br/>
  Validates fields with [Doubter](https://github.com/smikhalevski/doubter#readme) shapes.

- [react](./packages/react#readme)<br/>
  Hooks and components to integrate with React.

- [ref-plugin](./packages/ref-plugin#readme)<br/>
  Associates field with DOM elements.

- [reset-plugin](./packages/reset-plugin#readme)<br/>
  Manages field initial value and dirty status.

- [scroll-to-error-plugin](./packages/scroll-to-error-plugin#readme)<br/>
  Enables scrolling to a field that has an associated validation error. Works with any validation plugin in this repo.

- [uncontrolled-plugin](./packages/uncontrolled-plugin#readme)<br/>
  Updates fields by listening to change events of associated DOM elements.

- [zod-plugin](./packages/zod-plugin#readme)<br/>
  Validates fields with [Zod](https://zod.dev/) schemas.

# Basics

The central piece of Roqueform is the concept of a field. A field holds a value and provides a couple of ways to update
it. Fields can be enhanced by plugins that provide such things as integration with rendering and validation libraries.

Let's start by creating a field:

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
// ⮕ Field<number>

ageField.value;
// ⮕ 42
```

The field value type is inferred from the initial value, but you can explicitly specify the field value type:

```ts
const universeField = createField<{ planets?: string[] }>();
// ⮕ Field<{ planets?: string[] } | undefined>
```

Derive a new field from the existing one:

```ts
const planetsField = universeField.at('planets');
// ⮕ Field<string[] | undefined>
```

`planetsField` is a derived field, and it is linked to its parent `universeField`.

```ts
planetsField.key;
// ⮕ 'planets'

planetsField.parent;
// ⮕ universeField
```

Fields returned by the [`at`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Field.html#at) method have a
stable identity. This means that you can invoke `at` with the same key multiple times and the same field instance would
be returned:

```ts
universeField.at('planets');
// ⮕ planetsField
```

Most of the time you don't need to store a derived field in a variable if you already have a reference to a parent
field.

The derived field has all the same functionality as its parent, so you can derive a new field from it as well:

```ts
planetsField.at(0).at('name');
```

When a value is set to a derived field, a parent field value is also updated. If parent field doesn't have a value yet,
Roqueform would infer its type from on the derived field key.

```ts
universeField.at('planets').at(0).at('name').setValue('Mars')

universeField.value;
// ⮕ { planets: [{ name: 'Mars' }] }
```

By default, for a string key a parent object is created, and for a number key a parent array is created. You can change
this behaviour with [Accessors](#accessors).

When a value is set to a parent field, derived fields are also updated:

```ts
const nameField = universeField.at('planets').at(0).at('name');

nameField.value;
// ⮕ 'Mars'

universeField.setValue({ planets: ['Venus'] });

nameField.value;
// ⮕ 'Venus'
```

You can subscribe to a field to receive notifications about field state changes.

```ts
const unsubscribe = planetsField.subscribe((targetField, currentField) => {
  // Handle the update
});
// ⮕ () => void
```

Subscriber callbacks are called with two arguments:

<dl>
<dt><code>targetField</code></dt>
<dd>

The field that initiated the update. This can be `planetsField` itself, any of its derived fields, or any of its
ancestor fields.

</dd>
<dt><code>currentField</code></dt>
<dd>

The field to which the listener is subscribed. In this example it is `planetsField`.

</dd>
</dl>

Subscribers are called when a field value is changed or [when a plugin mutates the field object](#authoring-a-plugin).

# Transient updates

When a derived field value is set transiently, the value of its parent _isn't_ immediately updated.

```ts
const avatarField = createField();

avatarField.at('eyeColor').setTransientValue('green');

avatarField.at('eyeColor').value;
// ⮕ 'green'

avatarField.value;
// ⮕ undefined
```

You can check that a field is in a transient state:

```ts
avatarField.at('eyeColor').isTransient;
// ⮕ true
```

To propagate the transient value contained by the derived field to its parent, use
the [`dispatch`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Field.html#dispatch) method:

```ts
avatarField.at('eyeColor').dispatch();

avatarField.value;
// ⮕ { eyeColor: 'green' }
```

`setTransientValue` can be called multiple times, but only the most recent update is propagated to the parent field
after the `dispatch` call.

When a derived field is in a transient state, its value as observed from the parent may differ from the actual value:

```ts
const planetsField = createField(['Mars', 'Pluto']);

planetsField.at(1).setTransientValue('Venus');

planetsField.value[1];
// ⮕ 'Pluto'

planetsField.at(1).value;
// ⮕ 'Venus'
```

Values are synchronized after the update is dispatched:

```ts
planetsField.at(1).disaptch();

planetsField.value[1];
// ⮕ 'Venus'

planetsField.at(1).value;
// ⮕ 'Venus'
```

# Accessors

[`Accessor`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html) instances create, read and
update field values.

- When the new derived field is created, its value is read from the value of the parent field using the
  [`get`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html#get) of the associated accessor.

- When a derived field is updated, the parent value should be returned from the
  [`set`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html#set) of the associated accessor.

Be default, [`objectAccessor`](https://smikhalevski.github.io/roqueform/variables/roqueform.objectAccessor.html) is
used. It creates parent values depending on a derived field key: for a string key a parent object is created, for a
number key a parent array is created.

Provide an accessor along with the initial value to the field factory:

```ts
import { objectAccessor } from 'roqueform';

const usersField = createField(['Mars', 'Venus'], objectAccessor);
```

# Authoring a plugin

Plugin is a function that receives a field instance, an accessor, and a callback to notify the field subscribers about
changes. To illustrate how plugins work, let's create a simple plugin that enriches a field with a DOM element
reference.

```ts
import { Plugin } from 'roqueform';

const elementPlugin: Plugin<{ element: Element | null }> = field => {
  field.element = null;
};
```

> **Note**&ensp;The plugin function directly mutates the field instance. This is required since multiple plugins may be
> updating the same field and may need to share the same field identity.

To apply the plugin to a field, pass it to the field factory:

```ts
const planetField = createField({ name: 'Mars' }, elementPlugin);
// ⮕ Field<{ name: string }, { element: Element | null }>

planetField.element;
// ⮕ null
```

The plugin would be called for each derived field when it is first accessed:

```ts
planetField.at('name').element
// ⮕ null
```

We can now assign a DOM element reference to an `element` property, so we can later access an element through a field.
But with the current implementation, there's no way to notify field consumers that the value of the `element` property
has changed. Let's update the plugin implementation to trigger subscribers.

```ts
import { Plugin } from 'roqueform';

interface ElementMixin {

  readonly element: Element | null;

  setElement(element: Element | null): void;
}

const elementPlugin: Plugin<ElementMixin> = (field, accessor, notify) => {
  field.element = null;

  field.setElement = element => {
    field.element = element;
    
    // 🟡 Synchronously triggers subscribers
    notify();
  };
};
```

Now when `setElement` is called on a field, its subscribers would be invoked.

```ts
const planetField = createField({ name: 'Mars' }, elementPlugin);

planetField.at('name').subscribe((targetField, currentField) => {
  // Handle the update
  currentField.element;
  // ⮕ Element
});

planetField.at('name').setElement(document.getElementById('name'));
```

# Composing plugins

To combine multiple plugins into a single function, use the
[`applyPlugins`](https://smikhalevski.github.io/roqueform/variables/roqueform.applyPlugins.html) helper:

```ts
import { createField, applyPlugins } from 'roqueform';

createField(['Mars'], applyPlugins(plugin1, plugin2));
// ⮕ Field<string[], …>
```

# Validation scaffolding plugin

Roqueform a shipped with validation scaffolding plugin
[`validatePlugin`](https://smikhalevski.github.io/roqueform/variables/roqueform.validatePlugin.html), so you can build
your validation on top of it.

```ts
import { validationPlugin } from 'roqueform';

const plugin = validationPlugin((field, setInternalError) => {
  if (!field.at('name').value) {
    setInternalError(field.at('name'), 'Name must not be empty');
  }
});

const userField = createField({ name: 'James' }, plugin);

// Manually associate an error for a field
userField.setError('Some useful message');

userField.error;
// ⮕ 'Some useful message'
```

This plugin does all the heavy lifting related to field updates, manual validation error management, async validation
abortions, etc. It takes a validator callback or an object that has a `validate` method and an optional `validateAsync`
method. The validator receives a field that must be validated and a `setInternalError` callback that tells Roqueform
that an error should be assigned to a particular field.

To trigger validation call `validate`:

```ts
userField.at('name').setValue('');

userField.validate();

userField.at('name').error;
// ⮕ 'Name must not be empty'
```

`validatePlugin` distinguishes internal errors (those set via `setInternalError`) and external errors (those set via
`setError`). Internal errors are automatically cleared when the `validate` or `validateAsync` methods are called.
External errors are preserved as is, and you should explicitly call `clearErrors` delete them.

```ts
userField.clearErrors();
```

# Motivation

Roqueform was built to satisfy the following requirements:

- Since the form lifecycle consists of separate phases (input, validate, display errors, and submit), the form state
  management library should allow to tap in (or at least not constrain the ability to do so) at any particular phase to 
  tweak the data flow.

- Form data should be statically and strictly typed up to the very field value setter. So there must be a compilation
  error if the string value from the silly input is assigned to the number-typed value in the form state object.

- **Use the platform!** The form state management library must not constrain the use of the `form` submit behavior,
  browser-based validation, and other related native features.

- There should be no restrictions on how and when the form input is submitted because data submission is generally
  an application-specific process.

- There are many approaches to validation, and a great number of awesome validation libraries. The form library must
  be agnostic to where (client-side, server-side, or both), how (on a field or on a form level), and when (sync, or
  async) the validation is handled.

- Validation errors aren't standardized, so an arbitrary error object shape must be allowed and related typings must be
  seamlessly propagated to the error consumers/renderers.

- The library API must be simple and easily extensible.
