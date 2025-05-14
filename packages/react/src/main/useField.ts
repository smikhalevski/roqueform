import { useContext, useRef } from 'react';
import { createField, Field, FieldPlugin, ValueAccessor } from 'roqueform';
import { ValueAccessorContext } from './ValueAccessorContext.js';

export const useField: typeof createField = (initialValue?: any, plugins?: FieldPlugin[], accessor?: ValueAccessor) => {
  const fallbackAccessor = useContext(ValueAccessorContext);

  return (useRef<Field>().current ||= createField(initialValue, plugins || [], accessor || fallbackAccessor));
};
