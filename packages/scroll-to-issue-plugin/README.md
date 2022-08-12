# Scroll to an issue plugin for Roqueform

[Roqueform](https://github.com/smikhalevski/roqueform#readme) plugin that enables scrolling to a field that has an
associated validation issue.

```sh
npm install --save-prod @roqueform/scroll-to-issue-plugin
```

# Usage example

🔎[API documentation is available here.](https://smikhalevski.github.io/roqueform/modules/scroll_to_issue_plugin_src_main.html)

```tsx
import { useEffect } from 'react';
import { useField } from 'roqueform';
import { doubterPlugin } from '@roqueform/doubter-plugin';
import { refPlugin } from '@roqueform/refplugin';
import { scrollToIssuePlugin } from '@roqueform/scroll-to-issue-plugin';
import * as d from 'doubter';

// Define a runtime type using Doubter DSL
const valueType = d.object({
  bar: d.string().min(1),
});

export const App = () => {

  const rootField = useField(
    { bar: 'qux' },

    scrollToIssuePlugin(applyPlugins(
      refPlugin(),
      doubterPlugin(valueType)
    ))
  );

  const handleSubmit = (event: SyntheticEvent): void => {
    event.preventDefault();

    // Trigger validation
    rootField.validate();

    if (rootField.isInvalid()) {
      // Scroll to the topmost field that has an associated issue
      rootField.scrollToIssue(0, { behavior: 'smooth' });
      return;
    }

    // The form value to submit
    const value = rootField.getValue();
  };

  return (
    <form onSubmit={handleSubmit}>

      <Field field={rootField.at('bar')}>
        {barField => (
          <>
            <input
              // 🟡 Note that field ref is populated
              ref={barField.refCallback}
              value={barField.getValue()}
              onChange={event => {
                barField.dispatchValue(event.target.value);
              }}
            />

            {barField.getIssue()?.message}
          </>
        )}
      </Field>

      <button type="submit">
        {'Submit'}
      </button>

    </form>
  );
};
```
