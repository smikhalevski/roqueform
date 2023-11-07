import { createContext, Context } from 'react';
import { naturalAccessor, Accessor } from 'roqueform';

/**
 * The context that is used by {@link useField} to retrieve an accessor.
 */
export const AccessorContext: Context<Accessor> = createContext(naturalAccessor);

AccessorContext.displayName = 'AccessorContext';
