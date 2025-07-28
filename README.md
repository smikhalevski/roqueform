<p align="center">
  <a href="#readme"><picture>
    <source media="(prefers-color-scheme: dark)" srcset="./images/logo-dark.png" />
    <source media="(prefers-color-scheme: light)" srcset="./images/logo-light.png" />
    <img alt="Roqueform" src="./images/logo-light.png" width="500" />
  </picture></a>
</p>

<!--OVERVIEW-->

The form state management library that can handle hundreds of fields without breaking a sweat.

- Expressive and concise API with strict typings.
- Controlled and [uncontrolled inputs](#uncontrolled-plugin).
- Unparalleled extensibility with plugins.
- Supports your favourite rendering and [validation libraries](#validation-plugin).
- Compatible with [Standard Schema&#8239;<sup>↗</sup>](https://github.com/standard-schema/standard-schema#readme).
- [Just 2&#8239;kB gzipped&#8239;<sup>↗</sup>](https://bundlephobia.com/result?p=roqueform).

```sh
npm install --save-prod roqueform
```

<!--/OVERVIEW-->

<br>
 
<!--TOC-->

<span class="toc-icon">&emsp;&ensp;</span>[API docs&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/)

<span class="toc-icon">&emsp;&ensp;</span>[Live example&#8239;<sup>↗</sup>](https://stackblitz.com/edit/roqueform-example)

<span class="toc-icon">🔰&ensp;</span>**Features**

- [Introduction](#introduction)
- [Events and subscriptions](#events-and-subscriptions)
- [Transient updates](#transient-updates)
- [Accessors](#accessors)
- [Plugins](#plugins)

<span class="toc-icon">🔌&ensp;</span>**Built-in plugins**

- [Annotations plugin](#annotations-plugin)
- [Constraint validation API plugin](#constraint-validation-api-plugin)
- [Errors plugin](#errors-plugin)
- [DOM element reference plugin](#dom-element-reference-plugin)
- [Reset plugin](#reset-plugin)
- [Scroll to an error plugin](#scroll-to-an-error-plugin)
- [Uncontrolled plugin](#uncontrolled-plugin)
- [Validation plugin](#validation-plugin)

<span class="toc-icon">⚛️&ensp;</span>[**React integration**](#react-integration)

- [Eager and lazy re-renders](#eager-and-lazy-re-renders)
- [Reacting to changes](#reacting-to-changes)

<span class="toc-icon">🎯&ensp;</span>[**Motivation**](#motivation)

<!--/TOC-->

<!--ARTICLE-->

# Introduction

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

field.value; // ⮕ 'Pluto'
```

Provide the initial value for a field:

```ts
const ageField = createField(42);
// ⮕ Field<number>

ageField.value; // ⮕ 42
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

universeField.value; // ⮕ undefined
```

Retrieve a child field by its key:

```ts
const planetsField = universeField.at('planets');
// ⮕ Field<Planet[] | undefined>
```

`planetsField` is a child field, and it is linked to its parent `universeField`.

```ts
planetsField.key; // ⮕ 'planets'

planetsField.parent; // ⮕ universeField
```

Fields returned by the [`Field.at`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#at)
method have a stable identity. This means that you can invoke `at(key)` with the same key multiple times and the same
field instance is returned:

```ts
universeField.at('planets');
// ⮕ planetsField
```

So most of the time you don't need to store a child field in a variable if you already have a reference to a parent
field.

The child field has all the same functionality as its parent, so you can access its children as well:

```ts
planetsField.at(0).at('name');
// ⮕ Field<string | undefined>
```

When a value is set to a child field, a parent field value is also updated. If parent field doesn't have a value yet,
Roqueform would infer its type from a key of the child field.

```ts
universeField.value; // ⮕ undefined

universeField.at('planets').at(0).at('name').setValue('Mars');

universeField.value; // ⮕ { planets: [{ name: 'Mars' }] }
```

By default, for a key that is a numeric array index, a parent array is created, otherwise an object is created. You can
change this behaviour with [custom accessors](#accessors).

When a value is set to a parent field, child fields are also updated:

```ts
const nameField = universeField.at('planets').at(0).at('name');

nameField.value; // ⮕ 'Mars'

universeField.setValue({ planets: [{ name: 'Venus' }] });

nameField.value; // ⮕ 'Venus'
```

# Events and subscriptions

You can subscribe to events published by a field:

```ts
const unsubscribe = planetsField.subscribe(event => {
  if (event.type === 'valueChanged') {
    // Handle the field value change
  }
});
// ⮕ () => void
```

All events conform the
[`FieldEvent`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldEvent.html) interface.

Without plugins, fields publish only
[`valueChanged`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/types/roqueform.FieldEventType.html)
event when the field value is changed via
[`Field.setValue`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#setvalue).

The root field and its descendants are updated before `valueChanged` event is published, so it's safe to read field
values in a listener.

Fields use [SameValueZero&#8239;<sup>↗</sup>](https://262.ecma-international.org/7.0/#sec-samevaluezero) comparison to detect that
the value has changed.

```ts
planetsField.at(0).at('name').subscribe(event => {
  // Handle the event here
});

// ✅ The value has changed, the listener is called
planetsField.at(0).at('name').setValue('Mercury');

// 🚫 The value is unchanged, the listener isn't called
planetsField.at(0).setValue({ name: 'Mercury' });
```

Plugins may publish their own events. Here's an example of the
[`errorAdded`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/types/roqueform.FieldEventType.html) event
published by the [`errorsPlugin`](#errors-plugin).

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';

const field = createField({ name: 'Bill' }, [errorsPlugin()]);

field.subscribe(event => {
  if (event.type === 'errorAdded') {
    // Handle the error here
    event.payload; // ⮕ 'Illegal user'
  }
});

field.addError('Illegal user');
```

# Transient updates

When you call [`Field.setValue`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#setvalue)
on a field its value is updates along with values of its ancestors and descendants. To manually control the update
propagation to fields ancestors, you can use transient updates.

When a value of a child field is set transiently, values of its ancestors _aren't_ immediately updated.

```ts
const field = createField();
// ⮕ Field<any>

field.at('hello').setTransientValue('world');

field.at('hello').value; // ⮕ 'world'

// 🟡 Parent value wasn't updated
field.value; // ⮕ undefined
```

You can check that a field is in a transient state:

```ts
field.at('hello').isTransient; // ⮕ true
```

To propagate the transient value contained by the child field to its parent, use the
[`Field.flushTransient`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#flushtransient)
method:

```ts
field.at('hello').flushTransient();

// 🟡 The value of the parent field was updated
field.value; // ⮕ { hello: 'world' }
```

[`Field.setTransientValue`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueforminterfaces/roqueform.FieldCore.html#settransientvalue)
can be called multiple times, but only the most recent update is propagated to the parent field after
the `flushTransient` call.

When a child field is in a transient state, its value visible from the parent may differ from the actual value:

```ts
const planetsField = createField(['Mars', 'Pluto']);

planetsField.at(1).setTransientValue('Venus');

planetsField.at(1).value; // ⮕ 'Venus'

// 🟡 Transient value isn't visible from the parent
planetsField.value[1]; // ⮕ 'Pluto'
```

Values are synchronized after the update is propagated:

```ts
planetsField.at(1).flushTransient();

planetsField.at(1).value; // ⮕ 'Venus'

// 🟡 Parent and child values are now in sync
planetsField.value[1]; // ⮕ 'Venus'
```

# Accessors

[`ValueAccessor`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.ValueAccessor.html) creates, reads and
updates field values.

- When the child field is accessed via
  [`Field.at`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#at) method for the
  first time, its value is read from the value of the parent field using the
  [`ValueAccessor.get`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.ValueAccessor.html#get) method.

- When a field value is updated via
  [`Field.setValue`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#setvalue), then
  the parent field value is updated with the value returned from the
  [`ValueAccessor.set`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.ValueAccessor.html#set) method.
  If the updated field has child fields, their values are updated with values returned from the
  [`ValueAccessor.get`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.ValueAccessor.html#get) method.

By default, Roqueform uses
[`naturalValueAccessor`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/variables/roqueform.naturalValueAccessor.html) which
supports:

- plain objects,
- class instances,
- arrays,
- `Map`-like instances,
- `Set`-like instances.

If the field value object has `add()` and `[Symbol.iterator]()` methods, it is treated as a `Set` instance:

```ts
const usersField = createField(new Set(['Bill', 'Rich']));

usersField.at(0).value; // ⮕ 'Bill'

usersField.at(1).value; // ⮕ 'Rich'
```

If the field value object has `get()` and `set()` methods, it is treated as a `Map` instance:

```ts
const planetsField = createField(
  new Map([
    ['red', 'Mars'],
    ['green', 'Earth'],
  ])
);

planetsField.at('red').value; // ⮕ 'Mars'

planetsField.at('green').value; // ⮕ 'Earth'
```

When the field is updated, `naturalValueAccessor` infers a parent field value from the child field key: for a key that
is a numeric array index, a parent array is created, otherwise an object is created.

```ts
const carsField = createField();

carsField.at(0).at('brand').setValue('Ford');

carsField.value; // ⮕ [{ brand: 'Ford' }]
```

You can explicitly provide a custom accessor along with the initial value:

```ts
import { createField, naturalValueAccessor } from 'roqueform';

const field = createField(['Mars', 'Venus'], undefined, naturalValueAccessor);
```

# Plugins

[`FieldPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/types/roqueform.FieldPlugin.html) callbacks that are invoked
once for each newly created field. Plugins can constrain the type of the root field value and add mixins to the root
field and its descendants.

Pass an array of plugins that must be applied
to [`createField`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/functions/roqueform.createField.html):

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';

const field = createField({ hello: 'world' }, [errorsPlugin()]);
```

A plugin receives a mutable field instance and should enrich it with the additional functionality. To illustrate
how plugins work, let's create a simple plugin that enriches a field with a DOM element reference.

```ts
import { FieldPlugin } from 'roqueform';

interface MyValue {
  hello: string;
}

interface MyMixin {
  element: Element | null;
}

const myPlugin: FieldPlugin<MyValue, MyMixin> = field => {
  // 🟡 Initialize mixin properties
  field.element = null;
};
```

To apply the plugin to a field, pass it to the field factory:

```ts
const field = createField({ hello: 'world' }, [myPlugin]);
// ⮕ Field<MyValue, MyMixin>

field.element; // ⮕ null
```

The plugin is applied to the `field` itself and its descendants when they are accessed for the first time:

```ts
field.at('hello').element; // ⮕ null
```

Plugins can publish custom [events](#events-and-subscriptions). Let's update the `myPlugin` implementation so it
publishes an event when an element is changed:

```ts
import { FieldPlugin } from 'roqueform';

interface MyMixin {
  element: Element | null;

  setElement(element: Element | null): void;
}

const myPlugin: FieldPlugin<MyValue, MyMixin> = field => {
  field.element = null;

  field.setElement = element => {
    field.element = element;

    // 🟡 Publish an event for field listeners
    field.publish({
      type: 'elementChanged',
      target: field,
      relatedTarget: null,
      payload: element,
    });
  };
};
```

[`Field.publish`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/roqueform.FieldCore.html#publish) invokes
listeners subscribed to the field and its ancestors, so events bubble up to the root field which effectively enables
event delegation:

```ts
const field = createField({ hello: 'world' }, [myPlugin]);

// 1️⃣ Subscribe a listener to the root field
field.subscribe(event => {
  if (event.type === 'elementChanged') {
    event.target.element; // ⮕ document.body
  }
});

// 2️⃣ Event is published by the child field
field.at('hello').setElement(document.body);
```

# Annotations plugin

[`annotationsPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_annotations.html) associates arbitrary
data with fields.

```ts
import { createField } from 'roqueform';
import annotationsPlugin from 'roqueform/plugin/annotations';

const field = createField({ hello: 'world' }, [annotationsPlugin({ isDisabled: false })]);

field.at('hello').annotations.isDisabled; // ⮕ false
```

Update annotations for a single field:

```ts
field.annotate({ isDisabled: true });

field.annotations.isDisabled; // ⮕ true

field.at('hello').annotations.isDisabled; // ⮕ false
```

Annotate field and all of its children recursively:

```ts
field.annotate({ isDisabled: true }, { isRecursive: true });

field.annotations.isDisabled; // ⮕ true

// 🌕 The child field was annotated along with its parent
field.at('hello').annotations.isDisabled; // ⮕ true
```

Annotations can be updated using a callback. This is especially useful in conjunction with recursive flag:

```ts
field.annotate(
  field => {
    // Toggle isDisabled for the field and its descendants
    return { isDisabled: !field.annotations.isDisabled };
  },
  { isRecursive: true }
);
```

Subscribe to annotation changes:

```ts
field.subscribe(event => {
  if (event.type === 'annotationsChanged') {
    event.target.annotations; // ⮕ { isDisabled: boolean }
  }
});
```

# Constraint validation API plugin

[`constraintValidationPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_constraint-validation.html)
integrates fields with the
[Constraint validation API&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/API/Constraint_validation).

For example, let's use the plugin to validate text input:

```html
<input type="text" value="" required />
```

Create a new field:

```ts
import { createField } from 'roqueform';
import constraintValidationPlugin from 'roqueform/plugin/constraint-validation';

const field = createField({ hello: '' }, [constraintValidationPlugin()]);

// Associate the DOM element with the field
field.at('hello').ref(document.querySelector('input'));
```

Check if field is invalid:

```ts
field.at('hello').isInvalid; // ⮕ true

field.at('hello').validity.valueMissing; // ⮕ true
```

Show an error message balloon for the first invalid element that is associated with this field or any of its child
fields:

```ts
field.reportValidity();
```

Get the array of all invalid fields:

```ts
field.getInvalidFields();
// ⮕ [field.at('hello')]
```

Subscribe to the field validity changes:

```ts
field.subscribe(event => {
  if (event.type === 'validityChanged') {
    event.target.validity; // ⮕ ValidityState
  }
});
```

# Errors plugin

[`errorsPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_errors.html) associates errors with fields:

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
field.at('hello').isInvalid; // ⮕ true
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

By default, the error type is `any`. To restrict type of errors that can be added to a field, provide it explicitly:

```ts
interface MyError {
  message: string;
}

const field = createField({ hello: 'world' }, [
  errorsPlugin<MyError>(),
]);

field.errors; // ⮕ MyError[]
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
  errorsPlugin(concatMyErrors),
]);
```

To add an error to field, you can publish
an [`errorCaught`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/types/roqueform.FieldEventType.html)
event instead of calling
the[`addError`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_errors.ErrorsMixin.html#adderror) method:

```ts
field.publish({
  type: 'errorCaught',
  target: field,
  relatedTarget: null,
  payload: 'Ooops',
});

field.errors; // ⮕ ['Oops']
```

This is especially useful if you're developing a plugin that adds errors to fields but you don't want to couple with the
errors plugin implementation.

Subscribe to error changes:

```ts
field.subscribe(event => {
  if (event.type === 'errorAdded') {
    event.target.errors; // ⮕ MyError[]
  }
});
```

# DOM element reference plugin

[`refPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_ref.html) associates DOM elements with fields.

```ts
import { createField } from 'roqueform';
import refPlugin from 'roqueform/plugin/ref';

const field = createField({ hello: 'world' }, [refPlugin()]);

field.at('hello').ref(document.querySelector('input'));
```

Access an element associated with the field:

```ts
field.at('hello').element; // ⮕ Element | null
```

Focus and blur an element referenced by a field. If a field doesn't have an associated element this is a no-op.

```ts
field.at('hello').focus();

field.at('hello').isFocused; // ⮕ true
```

Scroll to an element:

```ts
field.at('hello').scrollIntoView({ behavior: 'smooth' });
```

# Reset plugin

[`resetPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_reset.html) enhances fields with methods that
manage the initial value.

```ts
import { createField } from 'roqueform';
import resetPlugin from 'roqueform/plugin/reset';

const field = createField({ hello: 'world' }, [resetPlugin()]);

field.at('hello').setValue('universe');

field.value; // ⮕ { hello: 'universe' }

field.reset();

// 🟡 The initial value was restored
field.value; // ⮕ { hello: 'world' }
```

Change the initial value of a field:

```ts
field.setInitialValue({ hello: 'universe' });

field.at('hello').initialValue; // ⮕ 'universe'
```

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to
the [`resetPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/functions/plugin_reset.default.html). By default,
values are compared using [fast-deep-equal&#8239;<sup>↗</sup>](https://github.com/epoberezkin/fast-deep-equal).

```ts
const field = createField({ hello: 'world' }, [resetPlugin()]);

field.at('hello').setValue('universe');

field.at('hello').isDirty; // ⮕ true

field.isDirty; // ⮕ true
```

Get the array of all dirty fields:

```ts
field.getDirtyFields();
// ⮕ [field, field.at('hello')]
```

# Scroll to an error plugin

[`scrollToErrorPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_scroll-to-error.html) enhances the field
with methods to scroll to the closest invalid field.

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

This plugin works best in conjunction with the [`errorsPlugin`](#errors-plugin). If the invalid field was associated
with an element
via [`ref`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_scroll-to-error.ScrollToErrorMixin.html#ref)
than `scrollToError()` scrolls the viewport the reveal this element.

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';
import scrollToErrorPlugin from 'roqueform/plugin/scroll-to-error';

const field = createField({ hello: 'world' }, [
  errorsPlugin(),
  scrollToErrorPlugin(),
]);

field.at('hello').ref(document.querySelector('input'));

field.at('hello').addError('Unknown world');

field.scrollToError();
// ⮕ field.at('hello')
```

If there are multiple invalid fields, provide an index to scroll to a particular field:

```ts
const field = createField({ name: 'X Æ A-12', age: 5 }, [
  errorsPlugin(),
  scrollToErrorPlugin(),
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

[`uncontrolledPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_uncontrolled.html) updates fields by
listening to change events of associated DOM elements.

```ts
import { createField } from 'roqueform';
import uncontrolledPlugin from 'roqueform/plugin/uncontrolled';

const field = createField({ hello: 'world' }, [
  uncontrolledPlugin(),
]);

field.at('hello').ref(document.querySelector('input'));
```

The plugin would synchronize the field value with the value of an input element.

If you have a set of radio buttons, or checkboxes that update a single field, call `ref` multiple times providing each
element. For example, let's use `uncontrolledPlugin` to manage an array of animal species:

```html
<input type="checkbox" value="Elephant">
<input type="checkbox" value="Monkey">
<input type="checkbox" value="Zebra">
```

Create a field:

```ts
const field = createField({ animals: ['Zebra'] }, [uncontrolledPlugin()]);
```

Associate all checkboxes with a field:

```ts
document
  .querySelectorAll('input[type="checkbox"]')
  .forEach(field.at('animals').ref);
```

Right after checkboxes are associated, input with the value "Zebra" becomes checked. This happens because
the `uncontrolledPlugin` updated the DOM to reflect the current state of the field.

If the user would check the "Elephant" value, then the field gets updated:

```ts
field.at('animals').value; // ⮕ ['Zebra', 'Elephant']
```

## Value coercion

By default, `uncontrolledPlugin` uses the opinionated element value accessor that applies following coercion rules to
values of form elements:

| Elements                 | Value                                                                                                                                                                                                                                                                                                                           |
|--------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Single checkbox          | `boolean`, see [`checkboxFormat`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessorOptions.html#checkboxformat).                                                                                                                                                 |
| Multiple&nbsp;checkboxes | An array of [`value`&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value) attributes of checked checkboxes, see [`checkboxFormat`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessorOptions.html#checkboxformat). |
| Radio buttons            | The [`value`&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#value) attribute of a radio button that is checked or `null` if no radio buttons are checked.                                                                                                                            |
| Number input             | `number`, or `null` if empty.                                                                                                                                                                                                                                                                                                   |
| Range input              | `number`                                                                                                                                                                                                                                                                                                                        |
| Date input               | The [`value`&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#value) attribute, or `null` if empty, see [`dateFormat`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessorOptions.html#dateformat).                        |
| Time input               | A time string, or `null` if empty, see [`timeFormat`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessorOptions.html#timeformat).                                                                                                                                 |
| Image input              | A string value of the [`value`&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/image#src) attribute.                                                                                                                                                                                        |
| File input               | [`File`&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/API/File) or `null` if no file selected, file inputs are read-only.                                                                                                                                                                                    |
| Multi-file input         | An array of [`File`&#8239;<sup>↗</sup>](https://developer.mozilla.org/en-US/docs/Web/API/File).                                                                                                                                                                                                                                 |
| Other                    | The `value` attribute, or `null` if element doesn't support it.                                                                                                                                                                                                                                                                 |

`null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to `value` attribute.

To change how values are read from and written to DOM, provide a custom
[`ElementsValueAccessor`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessor.html)
implementation to a plugin, or use a
[`createElementsValueAccessor`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/functions/plugin_uncontrolled.createElementsValueAccessor.html)
factory to customise the default behaviour:

```ts
import { createField } from 'roqueform';
import uncontrolledPlugin, { createElementsValueAccessor } from 'roqueform/plugin/uncontrolled';

const myValueAccessor = createElementsValueAccessor({
  dateFormat: 'timestamp',
});

const field = createField({ date: Date.now() }, [uncontrolledPlugin(myValueAccessor)]);
```

Read more about available options in
[`ElementsValueAccessorOptions`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_uncontrolled.ElementsValueAccessorOptions.html).

# Validation plugin

[`validationPlugin`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/modules/plugin_validation.html) enhances fields with
validation methods.

> [!TIP]\
> This plugin provides a low-level functionality. Prefer
> [`constraintValidationPlugin`](#constraint-validation-api-plugin), [`doubterPlugin`](./packages/doubter-plugin),
> [`zodPlugin`](./packages/zod-plugin) or other high-level validation plugins.

```ts
import { createField } from 'roqueform';
import validationPlugin from 'roqueform/plugin/validation';

const field = createField({ hello: 'world' }, [
  validationPlugin({
    validate(field) {
      if (field.key === 'hello') {
        field.isInvalid = field.value === 'world';
      }
    },
  }),
]);

field.at('hello').validate();

field.at('hello').isInvalid; // ⮕ true
```

The plugin takes a [`Validator`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/plugin_validation.Validator.html)
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
  },
};

const field = createField({ hello: 'world' }, [errorsPlugin(), validationPlugin(myValidator)]);

field.at('hello').validate();

field.at('hello').isInvalid; // ⮕ true
```

# React integration

Roqueform has first-class React integration. To enable it, first install the integration package:

```sh
npm install --save-prod @roqueform/react
```

[`useField`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/variables/_roqueform_react.useField.html) hook has the same
set of signatures as [`createField`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/functions/roqueform.createField.html):

```tsx
import { FieldRenderer, useField } from '@roqueform/react';

export function App() {
  const rootField = useField({ hello: 'world' });

  return (
    <FieldRenderer field={rootField.at('hello')}>
      {helloField => (
        <input
          type="text"
          value={helloField.value}
          onChange={event => helloField.setValue(event.target.value)}
        />
      )}
    </FieldRenderer>
  );
}
```

`useField` hook returns a [`Field`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/types/roqueform.Field.html) instance that
is preserved between re-renders.
The [`<FieldRenderer>`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/functions/_roqueform_react.FieldRenderer.html) component
subscribes to the given field instance and re-renders children when an event is published by the field.

When a user updates the input value, the `rootField.at('hello')` value is set and `<FieldRenderer>` component
is re-rendered.

If you pass a callback as an initial value, it would be invoked when the field is initialized.

```ts
useField(() => getInitialValue());
```

Pass an array of plugins as the second argument of the `useField` hook:

```ts
import { useField } from '@roqueform/react';
import errorsPlugin from 'roqueform/plugin/errors';

export function App() {
  const field = useField({ hello: 'world' }, [errorsPlugin()]);

  useEffect(() => {
    field.addError('The world is not enough');
  }, []);
}
```

## Eager and lazy re-renders

Let's consider the form with two `<FieldRenderer>` elements. One of them renders the value of the root field and
the other one renders an input that updates the child field:

```tsx
import { FieldRenderer, useField } from '@roqueform/react';

export function App() {
  const rootField = useField({ hello: 'world' });

  return (
    <>
      <FieldRenderer field={rootField}>{field => JSON.stringify(field.value)}</FieldRenderer>

      <FieldRenderer field={rootField.at('hello')}>
        {helloField => (
          <input
            type="text"
            value={helloField.value}
            onChange={event => helloField.setValue(event.target.value)}
          />
        )}
      </FieldRenderer>
    </>
  );
}
```

By default, `<FieldRenderer>` component re-renders only when the provided field was updated directly, so updates from
ancestors or child fields would be ignored. So when user edits the input value, `JSON.stringify` won't be re-rendered.

Add the
[`isEagerlyUpdated`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/_roqueform_react.FieldSubscriptionOptions.html#iseagerlyupdated)
property to force `<FieldRenderer>` to re-render whenever its value was affected.

```diff
- <FieldRenderer field={rootField}>
+ <FieldRenderer
+   field={rootField}
+   isEagerlyUpdated={true}
+ >
    {field => JSON.stringify(field.value)}
  </FieldRenderer>
```

Now both fields are re-rendered when user edits the input text.

## Reacting to changes

Use the
[`onChange`&#8239;<sup>↗</sup>](https://smikhalevski.github.io/roqueform/interfaces/_roqueform_react.FieldSubscriptionOptions.html#onchange)
handler that is triggered only when the field value was updated [non-transiently](#transient-updates).

```tsx
<FieldRenderer
  field={rootField.at('hello')}
  onChange={value => {
    // Handle the non-transient name changes
  }}
>
  {helloField => (
    <input
      type="text"
      value={helloField.value}
      onChange={event => helloField.setTransientValue(event.target.value)}
      onBlur={field.flushTransient}
    />
  )}
</FieldRenderer>
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

<!--/ARTICLE-->
