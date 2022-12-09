import { createContext } from 'react';
import { Accessor, objectAccessor } from 'roqueform';

/**
 * The context that is used by {@linkcode useField} to retrieve an accessor.
 */
export const AccessorContext = createContext<Accessor>(objectAccessor);

AccessorContext.displayName = 'AccessorContext';
