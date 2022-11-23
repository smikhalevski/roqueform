import { createContext } from 'react';
import { Accessor } from './field-types';
import { objectAccessor } from './objectAccessor';

/**
 * The context that is used by {@linkcode useField} to retrieve an accessor.
 */
export const AccessorContext = createContext<Accessor>(objectAccessor);

AccessorContext.displayName = 'AccessorContext';
