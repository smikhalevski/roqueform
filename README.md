# Roquefield&ensp;🧀&ensp;[![build](https://github.com/smikhalevski/roquefield/actions/workflows/master.yml/badge.svg?branch=master&event=push)](https://github.com/smikhalevski/roquefield/actions/workflows/master.yml)

The [1 kB](https://bundlephobia.com/result?p=roquefield) field state management library with strict typings that can
handle hundreds of fields per field without breaking a sweat.

```sh
npm install --save-prod roquefield
```

# Motivation

Field lifecycle consists of four separate phases: Input, Validate, Display Errors, and Submit. These phases can be
represented as non-intersecting black boxes. The result obtained during one phase may be used as an input for another
phase:

1. The input value is validated.
2. Validation errors are displayed.
3. Input value is submitted.
4. Validation errors received after a backend validation are displayed.

Since phases are non-intersecting, they should only share the knowledge about data shapes passed between them. This also
allows phases to be run in parallel. The couple of examples:

1. While user proceeds with input, we can asynchronously validate the input and show errors for fields that were not
   updated while validation was pending.
2. We can debounce computation-heavy asynchronous validation or abort it if the input has changed.

The field management solution must be agnostic to validation process, shouldn’t enforce the way errors are displayed, or
restrict how the data submission is handled.

Since data submission is application-specific, and there’s a great number of awesome validation libraries, we should
focus on streamlining the field input management and error display.

# Usage

```tsx
import {useField, Field} from 'roquefield';

const parentField = useField({foo: {bar: 123}});

<Field initialValue={parentField.at(1).at('foo')}>
  {(field) => (
      <>
        <input
            ref={field.ref}
            value={field.value}
            onChange={(event) => {
              field.setValue(event.target.value);
            }}
            onBlur={() => {
              field.dispatch()
            }}
        />
        <ErrorMessages errors={errors} field={field}/>
      </>
  )}
</Field>
```
