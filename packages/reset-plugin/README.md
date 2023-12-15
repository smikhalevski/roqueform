# Reset plugin for Roqueform

Manages [Roqueform](https://github.com/smikhalevski/roqueform#readme) field initial value and dirty status.

```sh
npm install --save-prod @roqueform/reset-plugin
```

# Overview

🔎 [API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/reset_plugin.html)

Update the initial value of a field:

```ts
import { createField } from 'roqueform';
import { resetPlugin } from '@roqueform/reset-plugin';

const planetField = createField({ name: 'Pluto' }, resetPlugin());

planetField.setInitialValue({ name: 'Mars' });

planetField.at('name').initialValue;
// ⮕ 'Mars'
```

The field is considered dirty when its value differs from the initial value. Values are compared using an equality
checker function passed to the `resetPlugin`. By default, values are compared using
[fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal).

```ts
planetField.at('name').isDirty // ⮕ true
```

Get the array of all dirty fields:

```ts
planetField.getDirtyFields();
// ⮕ [planetField.at('name')]
```
