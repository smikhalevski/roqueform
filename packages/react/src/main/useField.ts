import { useContext, useRef } from 'react';
import { createField, Field, FieldPlugin, ValueAccessor } from 'roqueform';
import { ValueAccessorContext } from './ValueAccessorContext.js';

/**
 * The hook that returns the {@link roqueform!Field Field} instance which identity doesn't change between renders.
 */
export const useField: typeof createField = (initialValue?: any, plugins?: FieldPlugin[], accessor?: ValueAccessor) => {
  const fallbackAccessor = useContext(ValueAccessorContext);

  return (useRef<Field>(null).current ||= createField(initialValue, plugins || [], accessor || fallbackAccessor));
};
