import { PubSub } from 'parallel-universe';
import { toArrayIndex } from './utils.js';

export interface Ref<V> {
  current: V;
}

export interface RefChangeEvent<V> {
  ref: ObservableRef<V>;
  prevValue: V;
  nextValue: V;
}

export interface ObservableRef<V> extends Ref<V> {
  subscribe(listener: (event: RefChangeEvent<V>) => void): () => void;
}

export function createObservableRef<V>(initialValue: V): ObservableRef<V> {
  const pubSub = new PubSub<RefChangeEvent<V>>();

  let value = initialValue;

  return Object.defineProperty(
    {
      current: initialValue,
      subscribe: pubSub.subscribe.bind(pubSub),
    },
    'current',
    {
      get() {
        return value;
      },

      set(nextValue) {
        const prevValue = value;

        if (Object.is(prevValue, nextValue)) {
          return;
        }

        value = nextValue;

        pubSub.publish({ ref: this, prevValue, nextValue });
      },
    }
  );
}

export function createObservableRefCollection<V>(initialValue: V): ArrayLike<V> {
  return new Proxy<any>([], {
    get(target, key) {
      let ref = target[key];

      if (ref === undefined && toArrayIndex(key) !== -1) {
        ref = createObservableRef(initialValue);
        target[key] = ref;
      }

      return ref;
    },

    set(target, key, value) {
      target[key] = value;
      return true;
    },
  });
}
