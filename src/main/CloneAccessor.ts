import {Accessor} from './Form';

export class CloneAccessor implements Accessor<any, any> {

  constructor(public path: any[]) {
  }

  get(parentValue: any): any {
    for (const key of this.path) {
      if (parentValue === null || typeof parentValue !== 'object') {
        return undefined;
      }
      parentValue = parentValue instanceof Map ? parentValue.get(key) : parentValue[key];
    }
    return parentValue;
  }

  set(parentValue: any, value: any): any {
    return cloneOrCreate(parentValue, this.path, 0, value);
  }
}

function cloneOrCreate(parentValue: any, keys: any[], keyIndex: number, value: unknown): unknown {
  if (keyIndex === keys.length) {
    return value;
  }

  const key = keys[keyIndex];

  if (parentValue === null || typeof parentValue !== 'object') {
    // Not an object
    const childValue = cloneOrCreate(undefined, keys, keyIndex + 1, value);

    if (typeof key === 'string' || typeof key === 'symbol') {
      parentValue = {[key]: childValue};

    } else if (typeof key === 'number') {
      parentValue = [];
      parentValue[key] = childValue;

    } else {
      parentValue = new Map();
      parentValue.set(key, childValue);
    }

  } else if (parentValue instanceof Map) {
    // Map
    parentValue = new (parentValue.constructor as MapConstructor)(parentValue);
    parentValue.set(key, cloneOrCreate(parentValue.get(key), keys, keyIndex + 1, value));

  } else {
    // Array or plain object
    parentValue = Array.isArray(parentValue) ? parentValue.slice(0) : Object.assign({}, parentValue);
    parentValue[key] = cloneOrCreate(parentValue[key], keys, keyIndex + 1, value);
  }

  return parentValue;
}
