# Uncontrolled elements plugin for Roqueform

Allows [Roqueform](https://github.com/smikhalevski/roqueform#readme) fields to be updated by DOM change events.

```tsx
import { useEffect } from 'react';
import { useField } from 'roqueform';
import { uncontrolledPlugin } from '@roqueform/uncontrolled-plugin';

export const App = () => {
  const field = useField({ bar: 'qux' }, uncontrolledPlugin());

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    // The field value is always in sync with the input element value
    field.value;
    // → { bar: 'qux' }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input ref={field.at('bar').refCallback}/>

      <input type="submit"/>
    </form>
  );
};
```
