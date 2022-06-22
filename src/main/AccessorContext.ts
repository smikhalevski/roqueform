import {createContext} from 'react';
import {Accessor} from './Field';
import {objectAccessor} from './objectAccessor';

export const AccessorContext = createContext<Accessor>(objectAccessor);

AccessorContext.displayName = 'AccessorContext';
