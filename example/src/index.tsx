import {render} from 'react-dom';
import {FC} from 'react';
import {Field, useField} from 'roqueform';

const App: FC = () => {

  const field = useField<{ foo: string, bar: number }[]>([]);

  return (
      <div>

        <Field field={field}>
          {(field) => field.value.map((_, i) => (
              <fieldset>

                <label>{i}</label>

                <p/>
                <Field field={field.at(i).at('foo')}>
                  {(field) => (
                      <input
                          type="text"
                          value={field.value}
                          onChange={(e) => field.setValue(e.target.value)}
                          onBlur={field.dispatch}
                      />
                  )}
                </Field>

                <p/>
                <Field field={field.at(i).at('bar')}>
                  {(field) => (
                      <input
                          type="number"
                          value={field.value}
                          onChange={(e) => field.setValue(e.target.valueAsNumber)}
                          onBlur={field.dispatch}
                      />
                  )}
                </Field>

                <p/>
                <button onClick={() => field.dispatchValue((value) => value.slice(0, i).concat(value.slice(i + 1)))}>
                  {'Remove'}
                </button>

              </fieldset>
          ))}
        </Field>

        <p/>
        <button onClick={() => field.dispatchValue((value) => value.concat({foo: '', bar: 0}))}>
          {'Add'}
        </button>
      </div>
  );
};

document.head.appendChild(document.createElement('style')).innerText = '* {outline: none}';

render(<App/>, document.body.appendChild(document.createElement('div')));
