import {createContext} from 'react';
import {Accessor} from './Form';
import {CloneAccessor} from './CloneAccessor';

export type AccessorFactory = (path: any[]) => Accessor<any, any>;

export const AccessorFactoryContext = createContext<AccessorFactory>((path) => new CloneAccessor(path));

AccessorFactoryContext.displayName = 'AccessorFactoryContext';
