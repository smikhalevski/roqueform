import { DependencyList, useRef } from 'react';

export function useSemanticMemo<T>(cb: () => T, deps: DependencyList): T {
  return (useRef<ReturnType<typeof createSemanticMemoHook>>().current ||= createSemanticMemoHook())(cb, deps);
}

export function createSemanticMemoHook() {
  let prevDeps: DependencyList | undefined;
  let value: any;

  return <T>(cb: () => T, deps: DependencyList): T => {
    if (areHookInputsEqual(deps, prevDeps)) {
      return value;
    }
    prevDeps = deps;
    value = cb();
    return value;
  };
}

/**
 * Returns `true` if hooks dependencies are equal, `false` otherwise.
 *
 * @see https://github.com/facebook/react/blob/c2034716a5bff586ab68c41a14139a535cbd788e/packages/react-reconciler/src/ReactFiberHooks.js#L314 github.com/facebook/react
 */
export function areHookInputsEqual(nextDeps: DependencyList, prevDeps: DependencyList | undefined): boolean {
  if (prevDeps === undefined || nextDeps.length !== prevDeps.length) {
    return false;
  }
  for (let i = 0; i < prevDeps.length; i++) {
    const a = nextDeps[i];
    const b = prevDeps[i];

    if ((a === a || b === b) && a !== b) {
      return false;
    }
  }
  return true;
}
