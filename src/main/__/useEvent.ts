import {useRef} from 'react';

export function useEvent<A extends any[], T>(handler: (...args: A) => T): (...args: A) => T;

export function useEvent<A extends any[], T>(handler: ((...args: A) => T) | undefined): (...args: A) => T | undefined;

export function useEvent<A extends any[], T>(handler: ((...args: A) => T) | undefined) {
  const handlerRef = useRef(handler);

  handlerRef.current = handler;

  return useRef<(...args: A) => any>().current ||= ((...args) => handlerRef.current?.(...args));
}
