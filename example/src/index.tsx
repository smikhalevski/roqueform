import {render} from 'react-dom';
import {FC, ReactNode} from 'react';
import {compose, Field, useErrors, useField, withErrors, withRef} from 'roqueform';

const App: FC = () => {

  const errors = useErrors<ReactNode>();

  const rootField = useField([{foo: '', bar: 0}], compose(withErrors(errors), withRef<HTMLInputElement>()));

  return (
      <div>

        <Field field={rootField}>
          {(rootField) => rootField.value.map((_, i) => (
              <fieldset>

                <label>{'Element ' + i}</label>

                <p/>
                <Field field={rootField.at(i).at('foo')}>
                  {(field) => (
                      <input
                          ref={field.ref}
                          type="text"
                          value={field.value}
                          onChange={(e) => field.dispatchValue(e.target.value)}
                      />
                  )}
                </Field>

                <p/>
                <Field field={rootField.at(i).at('bar')}>
                  {(field) => (
                      <input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.setValue(e.target.valueAsNumber)}
                          onBlur={field.dispatch}
                      />
                  )}
                </Field>

                <Field field={rootField.at(i)}>
                  {(field) => field.invalid && (
                      <p style={{color: 'red'}}>{field.error}</p>
                  )}
                </Field>

                <p/>
                <button onClick={() => rootField.dispatchValue((value) => value.slice(0, i).concat(value.slice(i + 1)))}>
                  {'Remove'}
                </button>

              </fieldset>
          ))}
        </Field>

        <p/>
        <button onClick={() => rootField.dispatchValue((value) => value.concat({foo: '', bar: 0}))}>
          {'Add'}
        </button>

        <p/>
        <button onClick={() => rootField.at(1).setError('Failure')}>
          {'Validate'}
        </button>

        <p/>
        <button onClick={() => errors.clear()}>
          {'Clear errors'}
        </button>

        <p/>
        <button onClick={() => rootField.at(0).at('foo').ref.current?.scrollIntoView()}>
          {'Scroll to 0'}
        </button>

        <p/>
        <Field
            field={rootField}
            eagerlyUpdated={true}
        >
          {(rootField) => (
              <pre>{JSON.stringify(rootField.value, null, 2)}</pre>
          )}
        </Field>
      </div>
  );
};

document.head.appendChild(document.createElement('style')).innerText = '* {outline: none}';

render(<App/>, document.body.appendChild(document.createElement('div')));
