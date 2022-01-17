import {Accessor} from './FormObject';

export function createPropertyAccessor(keys: any[]): Accessor<any, any> {
  return {

    get(upstream) {
      let value = upstream;

      for (const key of keys) {
        value = value?.[key];
      }

      return value;
    },

    set(upstream, value) {
      // for (let i = keys.length - 1; i >= 0; --i) {
      //   const key = keys[i];
      // }

      return cloneOrCreate(upstream, keys[0], value);
    },
  };
}

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
