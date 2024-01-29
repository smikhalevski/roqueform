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
- [Core features](#core-features)
- [Transient updates](#transient-updates)
- [Accessors](#accessors)
- [Authoring a plugin](#authoring-a-plugin)
- [Composing plugins](#composing-plugins)
- [Errors plugin](#errors-plugin)
- [Validation scaffolding plugin](#validation-scaffolding-plugin)
- [Motivation](#motivation)

# Plugins and integrations

- [react](./packages/react#readme)<br/>
  Hooks and components to integrate with React.

- [constraint-validation-plugin](./packages/constraint-validation-plugin#readme)<br/>
  Integrates fields with
  [Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).

- [doubter-plugin](./packages/doubter-plugin#readme)<br/>
  Validates fields with [Doubter](https://github.com/smikhalevski/doubter#readme) shapes.

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

- [annotations-plugin](./packages/annotations-plugin#readme)<br/>
  Adds support of custom annotations to fields.

# Core features

Roqueform core features don't rely on the rendering process. The central piece of Roqueform is the concept of a field.
A field holds a value and provides a means to update it. Let's start by creating a field:

```ts
import { createField } from 'roqueform';

const field = createField();
// ⮕ Field<unknown, any>
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
// ⮕ Field<unknown, number>

ageField.value;
// ⮕ 42
```

The field value type is inferred from the initial value, but you can explicitly specify the field value type:

```ts
interface Planet {
  name: string;
}

interface Universe {
  planets: Planet[];
}

const universeField = createField<Universe>();
// ⮕ Field<unknown, Universe | undefined>

universeField.value;
// ⮕ undefined
```

Derive a new field from the existing one:

```ts
const planetsField = universeField.at('planets');
// ⮕ Field<unknown, Planet[] | undefined>
```

`planetsField` is a child field, and it is linked to its parent `universeField`.

```ts
planetsField.key;
// ⮕ 'planets'

planetsField.parent;
// ⮕ universeField
```

Fields returned by the [`Field.at`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#at)
method have a stable identity. This means that you can invoke `at` with the same key multiple times and the same field
instance is returned:

```ts
universeField.at('planets');
// ⮕ planetsField
```

So most of the time you don't need to store a child field in a variable if you already have a reference to a parent
field.

The child field has all the same functionality as its parent, so you can derive a new field from it as well:

```ts
planetsField.at(0).at('name');
// ⮕ Field<unknown, string>
```

When a value is set to a child field, a parent field value is also updated. If parent field doesn't have a value yet,
Roqueform would infer its type from on the child field key.

```ts
universeField.value;
// ⮕ undefined

universeField.at('planets').at(0).at('name').setValue('Mars');

universeField.value;
// ⮕ { planets: [{ name: 'Mars' }] }
```

By default, for a string key a parent object is created, and for a valid array index key a parent array is created. You
can change this behaviour with [custom accessors](#accessors).

When a value is set to a parent field, child fields are also updated:

```ts
const nameField = universeField.at('planets').at(0).at('name');

nameField.value;
// ⮕ 'Mars'

universeField.setValue({ planets: [{ name: 'Venus' }] });

nameField.value;
// ⮕ 'Venus'
```

# Subscriptions

You can subscribe events dispatched onto the field. The returned callback would unsubscribe the subscriber.

```ts
const unsubscribe = planetsField.on('change:value', event => {
  // Handle the event
});
// ⮕ () => void
```

The [`Field.on`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#on) method
associates the event subscriber with an event type. All events that are dispatched onto fields have the share
[`Event`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Event.html).

By default, a field dispatches only events with `change:value` type, when the field value is changed via
[`Field.setValue`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#setValue).
The root field and all child fields are updated before subscribers are called, so it's safe to read field values in a
subscriber.

Fields use [SameValueZero](https://262.ecma-international.org/7.0/#sec-samevaluezero) comparison to detect that the
value has changed.

```ts
planetsField.at(0).at('name').on('change:value', subscriber);

// ✅ The subscriber is called
planetsField.at(0).at('name').setValue('Mercury');

// 🚫 Value is unchanged, the subscriber isn't called
planetsField.at(0).setValue({ name: 'Mercury' });
```

Plugins may introduce dispatch their own events:

```ts
import { createField, errorsPlugin } from 'roqueform';

const field = createField({ name: 'Bill' }, errorsPlugin());

field.on('change:errors', event => {
  // Handle changed errors
});
```

Subscribe to all events dispatched onto the field:

```ts
planetsField.on('*', event => {
  // Handle all events
});
```

# Transient updates

When you call [`Field.setValue`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#setValue)
on a field then subscribers of its ancestors and its updated child fields are triggered. To manually control the update
propagation to fields ancestors, you can use transient updates.

When a value of a child field is set transiently, values of its ancestors _aren't_ immediately updated.

```ts
const avatarField = createField();

avatarField.at('eyeColor').setTransientValue('green');

avatarField.at('eyeColor').value;
// ⮕ 'green'

// 🟡 Parent value wasn't updated
avatarField.value;
// ⮕ undefined
```

You can check that a field is in a transient state:

```ts
avatarField.at('eyeColor').isTransient;
// ⮕ true
```

To propagate the transient value contained by the child field to its parent, use
the [`Field.propagate`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#propagate)
method:

```ts
avatarField.at('eyeColor').propagate();

avatarField.value;
// ⮕ { eyeColor: 'green' }
```

`setTransientValue` can be called multiple times, but only the most recent update is propagated to the parent field
after the `propagate` call.

When a child field is in a transient state, its value as observed from the parent may differ from the actual value:

```ts
const planetsField = createField(['Mars', 'Pluto']);

planetsField.at(1).setTransientValue('Venus');

planetsField.value[1];
// ⮕ 'Pluto'

// 🟡 Transient value is different
planetsField.at(1).value;
// ⮕ 'Venus'
```

Values are synchronized after the update is propagated:

```ts
planetsField.at(1).propagate();

planetsField.value[1];
// ⮕ 'Venus'

planetsField.at(1).value;
// ⮕ 'Venus'
```

# Accessors

[`ValueAccessor`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html) creates, reads and updates
field values.

- When the child field is accessed via
  [`Field.at`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#at) method for the
  first time, its value is read from the value of the parent field using the
  [`ValueAccessor.get`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html#get) method.

- When a field value is updated via
  [`Field.setValue`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldController.html#setValue), then
  the parent field value is updated with the value returned from the
  [`ValueAccessor.set`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html#set) method. If the
  updated field has child fields, their values are updated with values returned from the
  [`ValueAccessor.get`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html#get) method.

You can explicitly provide a custom accessor along with the initial value. Be default, Roqueform uses
[`naturalValueAccessor`](https://smikhalevski.github.io/roqueform/variables/roqueform.naturalValueAccessor.html):

```ts
import { createField, naturalValueAccessor } from 'roqueform';

const field = createField(['Mars', 'Venus'], naturalValueAccessor);
```

`naturalValueAccessor` supports plain objects, class instances, arrays, `Map`-like, and `Set`-like instances.

If the field value object has `add` and `Symbol.iterator` methods, it is treated as a `Set` instance:

```ts
const usersField = createField(new Set(['Bill', 'Rich']));

usersField.at(0).value;
// ⮕ 'Bill'

usersField.at(1).value;
// ⮕ 'Rich'
```

If the field value object has `get` and `set` methods, it is treated as a `Map` instance:

```ts
const planetsField = createField(new Map([
  ['red', 'Mars'],
  ['green', 'Earth']
]));

planetsField.at('red').value;
// ⮕ 'Mars'

planetsField.at('green').value;
// ⮕ 'Earth'
```

When the field is updated, a parent field value is inferred from the key: for a positive integer key a parent array is
created, otherwise, an object is created.

```ts
const carsField = createField();

carsField.at(0).at('brand').setValue('Ford');

carsField.value;
// ⮕ [{ brand: 'Ford' }]
```

# Authoring a plugin

Plugins are applied to a field using a
[`PluginInjector`](https://smikhalevski.github.io/roqueform/types/roqueform.PluginInjector.html) callback. This callback
receives a mutable plugin instance and should enrich it with the plugin functionality. To illustrate how plugins work,
let's create a simple plugin that enriches a field with a DOM element reference.

```ts
import { PluginInjector } from 'roqueform';

const injectMyPlugin: PluginInjector<{ element: Element | null }> = field => {
  field.element = null;
};
```

To apply the plugin to a field, pass it to the field factory:

```ts
const planetField = createField({ name: 'Mars' }, injectMyPlugin);
// ⮕ Field<{ element: Element | null }, { name: string }>

planetField.element;
// ⮕ null
```

The plugin would be called for each child field when it is first accessed:

```ts
planetField.at('name').element
// ⮕ null
```

We can now assign a DOM element reference to an `element` property, so we can later access an element through a field.
Let's update the plugin implementation to notify subscribers that the element has changed.

```ts
import { PluginInjector, dispatchEvents } from 'roqueform';

interface ElementPlugin {

  readonly element: Element | null;

  setElement(element: Element | null): void;
}

const injectMyPlugin: PluginInjector<ElementPlugin> = field => {
  field.element = null;

  field.setElement = element => {
    if (field.element === element) {
      // Element is unchanged
      return;
    }

    field.element = element;

    // Synchronously triggers associated subscribers
    dispatchEvents([{
      type: 'changed:element',
      targetField: field,
      originField: field,
      data: null
    }]);
  };
};
```

Now when `setElement` is called on a field, its subscribers would be invoked.

```ts
const planetField = createField({ name: 'Mars' }, injectMyPlugin);

planetField.at('name').on('changed:element', event => {
  event.targetField.element;
  // ⮕ document.body
});

planetField.at('name').setElement(document.body);
```

# Composing plugins

To combine multiple plugins into a single function, use the
[`composePlugins`](https://smikhalevski.github.io/roqueform/variables/roqueform.composePlugins.html) helper:

```ts
import { createField, composePlugins } from 'roqueform';

createField(['Mars'], composePlugins(plugin1, plugin2));
// ⮕ Field<…, string[]>
```

# Errors plugin

Roqueform is shipped with the plugin that allows to associate errors with fields
[`errorsPlugin`](https://smikhalevski.github.io/roqueform/variables/roqueform.errorsPlugin.html).

```ts
import { errorsPlugin } from 'roqueform';

const userField = createField({ name: '' }, errorsPlugin());

userField.at('name').addError('Too short');

userField.at('name').errors;
// ⮕ ['Too short']
```

Get all invalid fields:

```ts
userField.getInvalidFields();
// ⮕ [userField.at('name')]
```

# Validation scaffolding plugin

Roqueform is shipped with the validation scaffolding plugin
[`validatePlugin`](https://smikhalevski.github.io/roqueform/variables/roqueform.validatePlugin.html), so you can build
your validation on top of it.

> [!NOTE]\
> This plugin provides a low-level functionality. Prefer
> [constraint-validation-plugin](./packages/constraint-validation-plugin), [doubter-plugin](./packages/doubter-plugin),
> or [zod-plugin](./packages/zod-plugin) or other high-level validation plugin.

```ts
import { validationPlugin } from 'roqueform';

const plugin = validationPlugin({
  validate(field) {
    if (!field.at('name').value) {
      field.at('name').isInvalid = true;
    }
  }
});

const userField = createField({ name: '' }, plugin);

userField.validate();
// ⮕ false

userField.at('name').isInvalid;
// ⮕ true
```

The plugin takes an object that has `validate` and `validateAsync` methods. Both methods receive a field that must be
validated and should update `isInvalid` of the field or any of its children.

Validation plugin works best in conjunction with [the errors plugin](#errors-plugin). The latter would update
`isInvalid` when an error is added or deleted:

```ts
import { validationPlugin } from 'roqueform';

const plugin = validationPlugin(
  // Make errors plugin available inside the validator
  errorsPlugin(),
  {
    validate(field) {
      if (!field.at('name').value) {
        // Add an error to the invalid field
        field.at('name').addError('Must not be blank')
      }
    }
  }
);

const userField = createField({ name: '' }, plugin);

userField.validate();
// ⮕ false

userField.at('name').errors;
// ⮕ ['Must not be blank']
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
