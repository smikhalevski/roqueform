# Zod plugin for Roqueform

Validates [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields with [Zod](https://zod.dev/) schemas.

```sh
npm install --save-prod @roqueform/zod-plugin
```

# Overview

Create a schema that would parse the field value:

```ts
import { z } from 'zod';

const fieldSchema = z.object({
  hello: z.string().max(5)
});
```

[`zodPlugin`](https://smikhalevski.github.io/roqueform/modules/_roqueform_zod-plugin.html) works best in
conjunction with [`errorsPlugin`](https://github.com/smikhalevski/roqueform?#errors-plugin):

```ts
import { createField } from 'roqueform';
import errorsPlugin from 'roqueform/plugin/errors';
import zodPlugin, { concatZodIssues } from '@roqueform/zod';

const field = createField({ hello: 'world' }, [
  errorsPlugin(concatZodIssues),
  zodPlugin(fieldSchema)
]);
```

The type of the field value is inferred from the provided schema, so the field value is statically checked.

When you call the `validate` method, it triggers validation of the field and all of its child fields. So if you call
`validate` on the child field, it won't validate the parent field:

```ts
// 🟡 Set an invalid value to the field
field.at('hello').setValue('universe');

field.at('hello').validate();
// ⮕ false

field.at('hello').errors // ⮕ [{ code: 'too_small', … }]
```

In this example, `field.value` _is not_ validated, and `field.at('hello').value` _is_ validated.

To detect whether the field, or any of its child fields contain a validation error:

```ts
field.at('hello').isInvalid;
// ⮕ true
```
