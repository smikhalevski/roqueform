import { createContext } from 'react';
import { naturalAccessor } from 'roqueform';

/**
 * The context that is used by {@link useField} to retrieve an accessor.
 */
export const AccessorContext = createContext(naturalAccessor);

AccessorContext.displayName = 'AccessorContext';
