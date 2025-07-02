import { createContext } from 'react';
import { naturalValueAccessor } from 'roqueform';

/**
 * The context that is used by {@link useField} to retrieve a default value accessor.
 */
export const ValueAccessorContext = createContext(naturalValueAccessor);

/**
 * @internal
 */
ValueAccessorContext.displayName = 'ValueAccessorContext';
