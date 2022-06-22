import {Accessor} from './Field';

export const objectAccessor: Accessor = {

  get: (obj, key) => obj?.[key],

  set: cloneOrCreate,
};

function cloneOrCreate(obj: any, key: any, value: any): any {
  if (obj !== null && typeof obj === 'object') {
    if (Object.is(obj[key], value)) {
      return obj;
    }
    obj = Array.isArray(obj) ? obj.slice(0) : Object.assign({}, obj);
  } else {
    obj = typeof key === 'number' ? [] : {};
  }
  obj[key] = value;
  return obj;
}
