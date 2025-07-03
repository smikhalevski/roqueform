<p align="center">
  <a href="#readme"><picture>
    <source media="(prefers-color-scheme: dark)" srcset="./images/logo-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./images/logo-light.png" />
    <img alt="Doubter" src="./images/logo-light.png" width="500" />
  </picture></a>
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
- [Events and subscriptions](#events-and-subscriptions)
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
  Enables custom annotations and metadata for fields.

# Core features

The central piece of Roqueform is the concept of a field. A field holds a value and provides a means to update it.

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
interface Planet {
  name: string;
}

interface Universe {
  planets: Planet[];
}

const universeField = createField<Universe>();
// ⮕ Field<Universe | undefined>

universeField.value;
// ⮕ undefined
```

Retrieve a child field by its key:

```ts
const planetsField = universeField.at('planets');
// ⮕ Field<Planet[] | undefined>
```

`planetsField` is a child field, and it is linked to its parent `universeField`.

```ts
planetsField.key;
// ⮕ 'planets'

planetsField.parent;
// ⮕ universeField
```

Fields returned by the [`Field.at`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#at)
method have a stable identity. This means that you can invoke `at` with the same key multiple times and the same field
instance is returned:

```ts
universeField.at('planets');
// ⮕ planetsField
```

So most of the time you don't need to store a child field in a variable if you already have a reference to a parent
field.

The child field has all the same functionality as its parent, so you can access its children as well:

```ts
planetsField.at(0).at('name');
// ⮕ Field<string>
```

When a value is set to a child field, a parent field value is also updated. If parent field doesn't have a value yet,
Roqueform would infer its type from a key of the child field.

```ts
universeField.value;
// ⮕ undefined

universeField.at('planets').at(0).at('name').setValue('Mars');

universeField.value;
// ⮕ { planets: [{ name: 'Mars' }] }
```

By default, for a key that is a numeric array index, a parent array is created, otherwise an object is created. You can
change this behaviour with [custom accessors](#accessors).

When a value is set to a parent field, child fields are also updated:

```ts
const nameField = universeField.at('planets').at(0).at('name');

nameField.value;
// ⮕ 'Mars'

universeField.setValue({ planets: [{ name: 'Venus' }] });

nameField.value;
// ⮕ 'Venus'
```

# Events and subscriptions

You can subscribe events dispatched onto the field.

```ts
const unsubscribe = planetsField.on('valueChanged', event => {
  // Handle the field value change
});
// ⮕ () => void
```

The [`Field.on`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#on) method
associates the event subscriber with an event type. All events that are dispatched onto fields have the share
[`Event`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Event.html).

Without plugins, fields can dispatch events with
[`change:value`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#on.on-2) type. This
event is dispatched when the field value is changed via
[`Field.setValue`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#setValue).

Plugins may dispatch their own events. Here's an example of the
[`change:errors`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.ErrorsPlugin.html#on.on-1) event
introduced by the [`errorsPlugin`](#errors-plugin).

```ts
import { createField, errorsPlugin } from 'roqueform';

const field = createField({ name: 'Bill' }, errorsPlugin());

field.on('change:errors', event => {
  // Handle error change
});

field.addError('Illegal user');
```

The root field and all child fields are updated before `change:value` subscribers are called, so it's safe to read field
values in a subscriber. Fields use [SameValueZero](https://262.ecma-international.org/7.0/#sec-samevaluezero) comparison to detect that the value has changed.

```ts
planetsField.at(0).at('name').on('valueChanged', subscriber);

// ✅ The subscriber is called
planetsField.at(0).at('name').setValue('Mercury');

// 🚫 Value is unchanged, the subscriber isn't called
planetsField.at(0).setValue({ name: 'Mercury' });
```

Subscribe to all events dispatched onto the field using the glob event type:

```ts
planetsField.subscribe(event => {
  // Handle all events
});
```

# Transient updates

When you call [`Field.setValue`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#setValue)
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

To propagate the transient value contained by the child field to its parent, use the
[`Field.propagate`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#propagate)
method:

```ts
avatarField.at('eyeColor').propagate();

avatarField.value;
// ⮕ { eyeColor: 'green' }
```

[`Field.setTransientValue`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#setTransientValue)
can be called multiple times, but only the most recent update is propagated to the parent field after the `propagate`
call.

When a child field is in a transient state, its value visible from the parent may differ from the actual value:

```ts
const planetsField = createField(['Mars', 'Pluto']);

planetsField.at(1).setTransientValue('Venus');

planetsField.value[1];
// ⮕ 'Pluto'

// 🟡 Transient value isn't visible from the parent
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

[`ValueAccessor`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.ValueAccessor.html) creates, reads and
updates field values.

- When the child field is accessed via
  [`Field.at`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#at) method for the
  first time, its value is read from the value of the parent field using the
  [`ValueAccessor.get`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.Accessor.html#get) method.

- When a field value is updated via
  [`Field.setValue`](https://smikhalevski.github.io/roqueform/classes/roqueform.FieldImpl.html#setValue), then
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

`naturalValueAccessor` supports:
- plain objects,
- class instances,
- arrays,
- `Map`-like,
- `Set`-like instances.

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

When the field is updated, a parent field value is inferred from the key: for a key that is a numeric array index,
a parent array is created, otherwise an object is created.

```ts
const carsField = createField();

carsField.at(0).at('brand').setValue('Ford');

carsField.value;
// ⮕ [{ brand: 'Ford' }]
```

# Authoring a plugin

Plugins are applied to a field using a
[`FieldPlugin`](https://smikhalevski.github.io/roqueform/types/roqueform.FieldPlugin.html) callback. This callback
receives a mutable plugin instance and should enrich it with the plugin functionality. To illustrate how plugins work,
let's create a simple plugin that enriches a field with a DOM element reference.

```ts
import { FieldPlugin } from 'roqueform';

interface ElementPlugin {
  element: Element | null;
}

const injectElementPlugin: FieldPlugin<ElementPlugin> = field => {
  // Update field with plugin functionality
  field.element = null;
};
```

To apply the plugin to a field, pass it to the field factory:

```ts
const planetField = createField(
  { name: 'Mars' },
  injectElementPlugin
);
// ⮕ Field<{ name: string }, { element: Element | null }>

planetField.element;
// ⮕ null
```

The plugin is applied to the `planetField` itself and each of its child fields when they are accessed for the first
time:

```ts
planetField.at('name').element
// ⮕ null
```

We can now assign a DOM element reference to an `element` property, so we can later access an element through a field.

Plugins may dispatch custom events. Let's update the plugin implementation to notify subscribers that the element has
changed.

```ts
import { FieldPlugin, dispatchEvents } from 'roqueform';

interface ElementPlugin {
  element: Element | null;

  setElement(element: Element | null): void;
}

const injectElementPlugin: FieldPlugin<ElementPlugin> = field => {
  field.element = null;

  field.setElement = element => {
    if (field.element !== element) {
      field.element = element;

      // Synchronously trigger associated subscribers
      dispatchEvents([{
        type: 'changed:element',
        target: field,
        relatedTarget: field,
        payload: null
      }]);
    }
  };
};
```

Here we used [`dispatchEvents`](https://smikhalevski.github.io/roqueform/functions/roqueform.dispatchEvents.html) helper
that invokes subscribers for provided events. So when `setElement` is called on a field, its subscribers would be
notified about element changes:

```ts
const planetField = createField(
  { name: 'Mars' },
  injectElementPlugin
);

planetField.at('name').on('changed:element', event => {
  event.target.element;
  // ⮕ document.body
});

planetField.at('name').setElement(document.body);
```

# Composing plugins

To combine multiple plugins into a single function, use the
[`composePlugins`](https://smikhalevski.github.io/roqueform/functions/roqueform.composePlugins.html) helper:

```ts
import { createField, composePlugins } from 'roqueform';

createField(['Mars'], composePlugins(plugin1, plugin2));
// ⮕ Field<string[], …>
```

# Errors plugin

To associate errors with fields,
use [errors plugin](https://smikhalevski.github.io/roqueform/interfaces/plugin_errors.ErrorsMixin.html):

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';

const field = createField({ hello: 'world' }, [errorsPlugin()]);

field.at('hello').addError('The world is not enough');
```

Read errors associated with the field:

```ts
field.at('hello').errors;
// ⮕ ['The world is not enough']
```

Check that the field has associated errors:

```ts
field.at('hello').isInvalid // ⮕ true
```

Check that a field or any of its descendants have associated errors:

```ts
field.getInvalidFields();
// ⮕ [field.at('hello')]
```

Delete an error from the field:

```ts
field.at('hello').deleteError('The world is not enough');
```

Clear all errors from the field and its descendants:

```ts
field.clearErrors({ isRecursive: true });
```

By default, error type is `any`. To restrict type of errors that can be added to a field, provide it explicitly:

```ts
interface MyError {
  message: string;
}

const field = createField({ hello: 'world' }, [errorsPlugin<MyError>()]);

field.errors // ⮕ MyError[]
```

To have more control over how errors are added to a field, provide an error concatenator callback:

```ts
import { createField } from 'roqueform';
import errorsPlugin, { ErrorsConcatenator } from 'roqueform/plugin/errors';

interface MyError {
  message: string;
}

const concatMyErrors: ErrorsConcatenator<MyError> = (prevErrors, error) => {
  return prevErrors.includes(error) ? prevErrors : [...prevErrors, error];
};

const field = createField({ hello: 'world' }, [
  errorsPlugin(concatMyErrors)
]);
```

To add an error to field, you can publish
an [`errorCaught`](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldEventRegistry.html#errorcaught)
event instead of calling
the[`addError`](https://smikhalevski.github.io/roqueform/interfaces/plugin_errors.ErrorsMixin.html#adderror) method:

```ts
field.publish({
  type: 'errorCaught',
  target: field,
  relatedTarget: null,
  payload: 'Ooops'
});

field.errors // ⮕ ['Oops']
```

This is especially useful if you're developing a plugin that adds errors to fields but you don't want to couple with the
errors plugin implementation.

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

# Annotations plugin

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
planetField.annotate({ isDisabled: true }, { isRecursive: true });

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
  { isRecursive: true }
);
```

Subscribe to annotation changes:

```ts
planetField.subscribe('annotationsChanged', event => {
  event.target.annotations;
  // ⮕ { isDisabled: boolean }
});
```

# Constraint validation API plugin

Integrates fields with the
[Constraint validation API](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).

This plugin doesn't require any rendering framework. It subscribes to events that are dispatched by a DOM element passed
to the [`ref`](https://smikhalevski.github.io/roqueform/interfaces/constraint_validation_plugin.ConstraintValidationPlugin.html#ref)
method. To simplify the usage example, we're going to use [the React integration](../react#readme).

```tsx
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

# DOM element reference plugin

Associates fields with DOM elements.

```ts
import { createField } from 'roqueform';
import refPlugin from 'roqueform/plugin/ref';

const field = createField({ hello: 'world' }, [refPlugin()]);

field.at('hello').ref(document.querySelector('input'));
```

Access an element associated with the field:

```ts
field.at('hello').element // ⮕ Element | null
```

Focus and blur an element referenced by a field. If a field doesn't have an associated element this is a no-op.

```ts
field.at('hello').focus();

field.at('hello').isFocused // ⮕ true
```

Scroll to an element:

```ts
field.at('hello').scrollIntoView({ behavior: 'smooth' });
```

# Reset plugin

Enhances fields with methods that manage the initial value.

```ts
import { createField } from 'roqueform';
import resetPlugin from 'roqueform/plugin/reset';

const field = createField({ hello: 'world' }, [resetPlugin()]);

field.at('hello').setValue('universe');

field.value // ⮕ { hello: 'universe' }

field.reset();

// 🟡 The initial value was restored
field.value // ⮕ { hello: 'world' }
```

Change the initial value of a field:

```ts
field.setInitialValue({ hello: 'universe' });

field.at('hello').initialValue;
// ⮕ 'universe'
```

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to
the [`resetPlugin`](https://smikhalevski.github.io/roqueform/functions/plugin_reset.default.html). By default,
values are compared using [fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal).

```ts
const field = createField({ hello: 'world' }, [resetPlugin()]);

field.at('hello').setValue('universe');

field.at('hello').isDirty // ⮕ true

field.isDirty // ⮕ true
```

Get the array of all dirty fields:

```ts
field.getDirtyFields();
// ⮕ [field, field.at('hello')]
```

# Scroll to an error plugin

Enhances the field with methods to scroll to the closest invalid field.

```ts
import { createField } from 'roqueform';
import scrollToErrorPlugin from 'roqueform/plugin/scroll-to-error';

const field = createField({ hello: 'world' }, [scrollToErrorPlugin()]);

// Associate a field with a DOM element
field.at('hello').ref(document.querySelector('input'));

// Mark a field as invalid
field.at('hello').isInvalid = true;

// Scroll to an invalid field
field.scrollToError();
// ⮕ field.at('hello')
```

This plugin works best in conjunction with the [`errorsPlugin`](#errors-plugin). If an element associated with the field
via [`ref`](https://smikhalevski.github.io/roqueform/interfaces/plugin_scroll-to-error.ScrollToErrorMixin.html#ref) is
connected to DOM and an the field is invalid than `scrollToError()` would scroll the viewport, so the element is reveled
on the screen.

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';
import scrollToErrorPlugin from 'roqueform/plugin/scroll-to-error';

const field = createField({ hello: 'world' }, [
  errorsPlugin(),
  scrollToErrorPlugin()
]);

field.at('hello').ref(document.querySelector('input'));

field.at('hello').addError('Unknown world')

field.scrollToError();
// ⮕ field.at('hello')
```

If there are multiple invalid fields, provide an index to scroll to a particular field:

```ts
const field = createField({ name: 'X Æ A-12', age: 5 }, [
  errorsPlugin(),
  scrollToErrorPlugin()
]);

// Associate fields with DOM elements
field.at('name').ref(document.getElementById('#name'));

field.at('age').ref(document.getElementById('#age'));

// Add errors to fields
field.at('name').addError('Too weird');

field.at('age').addError('Too young');

// Scroll to the second field that contains an error
field.scrollToError(1);
// ⮕ field.at('age')
```

# Uncontrolled plugin

Updates fields by listening to change events of associated DOM elements.

```ts
import { createField } from 'roqueform';
import uncontrolledPlugin from 'roqueform/plugin/uncontrolled';

const field = createField({ hello: 'world' }, [uncontrolledPlugin()]);

field.at('hello').ref(document.querySelector('input'));
```

The plugin would synchronize the field value with the value of an input element. When the input value is changed and
DOM `input` event is dispatched, the `field` is updated with the corresponding value.

If you have a set of radio buttons, or checkboxes that update a single field, call `ref` multiple times providing each
element.

For example, let's use `uncontrolledPlugin` to manage an array of animal species:

```html
<input type="checkbox" value="Elephant">
<input type="checkbox" value="Monkey">
<input type="checkbox" value="Zebra">
```

Create a field:

```ts
const field = createField({ animals: ['Zebra'] }, [uncontrolledPlugin()]);
```

Associate checkboxes with a field:

```ts
document.querySelectorAll('input[type="checkbox"]').forEach(field.at('animals').ref);
```

Right after checkboxes are associated, input with value "Zebra" becomes checked. This happens because
the `uncontrolledPlugin` updated the DOM to reflect the current state of the field.

If the user would check the "Elephant" value, then the field gets updated:

```ts
field.at('animals').value // ⮕ ['Zebra', 'Elephant']
```

## Value coercion

By default, `uncontrolledPlugin` uses the opinionated element value accessor that applies following coercion rules to
values of form elements:

| Elements                 | Value                                                                                                                                                                                                           |
|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Single checkbox          | `boolean`, see {@link ElementsValueAccessorOptions.checkboxFormat checkboxFormat}.                                                                                                                              |
| Multiple&nbsp;checkboxes | An array of [`value`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value) attributes of checked checkboxes, see {@link ElementsValueAccessorOptions.checkboxFormat checkboxFormat}. |
| Radio buttons            | The [`value`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#value) attribute of a radio button that is checked or `null` if no radio buttons are checked.                               |
| Number input             | `number`, or `null` if empty.                                                                                                                                                                                   |
| Range input              | `number`                                                                                                                                                                                                        |
| Date input               | The [`value`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#value) attribute, or `null` if empty, see {@link ElementsValueAccessorOptions.dateFormat dateFormat}.                        |
| Time input               | A time string, or `null` if empty, see {@link ElementsValueAccessorOptions.timeFormat timeFormat}.                                                                                                              |
| Image input              | A string value of the [`value`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/image#src) attribute.                                                                                           |
| File input               | {@link File} or `null` if no file selected, file inputs are read-only.                                                                                                                                          |
| Multi-file input         | An array of {@link File}.                                                                                                                                                                                       |
| Other                    | The `value` attribute, or `null` if element doesn't support it.                                                                                                                                                 |

`null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to `value` attribute.

This behaviour can be changed by passing a custom
[`ElementsValueAccessor`](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessor.html)
implementation to a plugin. Or you can use a
[`createElementsValueAccessor`](https://smikhalevski.github.io/roqueform/functions/plugin_uncontrolled.createElementsValueAccessor.html)
factory to customise the default behaviour:

```ts
import { createField } from 'roqueform';
import uncontrolledPlugin, { createElementsValueAccessor } from 'roqueform/plugin/uncontrolled';

const myValueAccessor = createElementsValueAccessor({
  dateFormat: 'timestamp'
});

const field = createField({ date: Date.now() }, [
  uncontrolledPlugin(myValueAccessor)
]);
```

Read more about available options in
[`ElementsValueAccessorOptions`](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessorOptions.html).

# Validation plugin

Enhances the field with validation methods.

> [!TIP]\
> This plugin provides a low-level functionality. Prefer
> [constraint-validation-plugin](#constraint-validation-api-plugin), [doubter-plugin](./packages/doubter-plugin),
> or [zod-plugin](./packages/zod-plugin) or other high-level validation plugin.

```ts
import { createField } from 'roqueform';
import validationPlugin from 'roqueform/plugin/validation';

const field = createField({ hello: 'world' }, [
  validationPlugin({
    validate(field) {
      if (field.key === 'hello') {
        field.isInvalid = field.value === 'world';
      }
    }
  })
]);

field.at('hello').validate();

field.at('hello').isInvalid // ⮕ true
```

The plugin takes a [`Validator`](https://smikhalevski.github.io/roqueform/interfaces/plugin_validation.Validator.html)
that has `validate` and `validateAsync` methods. Both methods receive a field that must be validated and should update
the `isInvalid` property of the field or any of its children when needed.

Validation plugin works best in conjunction with [the errors plugin](#errors-plugin). The latter would update
`isInvalid` when an error is added or deleted:

```ts
import { createField } from 'roqueform';
import errorsPlugin, { ErrorsMixin } from 'roqueform/plugin/errors';
import validationPlugin, { Validator } from 'roqueform/plugin/validation';

const myValidator: Validator<void, ErrorsMixin> = {
  validate(field) {
    if (field.key === 'hello' && field.value === 'world') {
      field.addError('The world is not enough');
    }
  }
};

const field = createField({ hello: 'world' }, [
  errorsPlugin(),
  validationPlugin(myValidator)
]);

field.at('hello').validate();

field.at('hello').isInvalid // ⮕ true
```

# React integration

Hooks and components to integrate Roqueform with React.

```sh
npm install --save-prod @roqueform/react
```

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

## Eager and lazy re-renders

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
ancestors or child fields would be ignored. Add the `isEagerlyUpdated` property to force `FieldRenderer` to re-render
whenever its value was affected.

```diff
- <FieldRenderer field={planetField}>
+ <FieldRenderer
+   field={planetField}
+   isEagerlyUpdated={true}
+ >
    {() => JSON.stringify(planetField.value)}
  </FieldRenderer>
```

Now both fields are re-rendered when user edits the input text.

## Reacting to changes

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

