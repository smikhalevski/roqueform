# Doubter plugin for Roqueform

Validates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with
[Doubter](https://github.com/smikhalevski/doubter#readme) shapes.

```sh
npm install --save-prod @roqueform/doubter-plugin
```

# Overview

Create a shape that would parse the field value:

```ts
import * as d from 'doubter';

const fieldShape = d.object({
  hello: d.string().max(5)
});

```

[`doubterPlugin`](https://smikhalevski.github.io/roqueform/modules/_roqueform_doubter-plugin.html) works best in
conjunction with [`errorsPlugin`](https://github.com/smikhalevski/roqueform?#errors-plugin):

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';
import doubterPlugin, { concatDoubterIssues } from '@roqueform/doubter';

const field = createField({ hello: 'world' }, [
  errorsPlugin(concatDoubterIssues),
  doubterPlugin(fieldShape)
]);
```

The type of the field value is inferred from the provided shape, so the field value is statically checked.

When you call the `validate` method, it triggers validation of the field and all of its child fields. So if you call
`validate` on the child field, it won't validate the parent field:

```ts
// 🟡 Set an invalid value to the field
field.at('hello').setValue('universe');

field.at('hello').validate();
// ⮕ false

field.at('hello').errors // ⮕ [{ message: 'Must have the maximum length of 5', … }]
```

In this example, `field.value` _is not_ validated, and `field.at('hello').value` _is_ validated.

> [!NOTE]\
> It's safe to trigger validation of a single text field on every keystroke, since validation doesn't have to process
> the state of the whole form.

To detect whether the field, or any of its child fields contain a validation error:

```ts
field.at('hello').isInvalid;
// ⮕ true
```

# Custom error messages

You can customize messages for errors raised by Doubter:

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';
import doubterPlugin, { concatDoubterIssues } from '@roqueform/doubter';

const fieldShape = d.array(d.string(), 'Expected an array').min(3, 'Not enough elements');

const field = createField(['hello', 'world'], [
  errorsPlugin(concatDoubterIssues),
  doubterPlugin(fieldShape)
]);

field.validate();
// ⮕ false

field.errors // ⮕ [{ message: 'Not enough elements', … }]
```

Read more about [error message localization](https://github.com/smikhalevski/doubter?tab=readme-ov-file#localization)
with Doubter.
