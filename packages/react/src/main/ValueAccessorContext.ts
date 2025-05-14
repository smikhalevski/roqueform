import { Context, createContext } from 'react';
import { naturalValueAccessor, ValueAccessor } from 'roqueform';

/**
 * The context that is used by {@link useField} to retrieve a default value accessor.
 */
export const ValueAccessorContext: Context<ValueAccessor> = createContext(naturalValueAccessor);

/**
 * @hidden
 */
ValueAccessorContext.displayName = 'ValueAccessorContext';
