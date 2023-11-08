import { dispatchEvents, Field, FieldEvent, PluginCallback } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';
import { createElementValueAccessor, ElementValueAccessor } from './createElementValueAccessor';

const EVENT_TRACK = 'trackedElementsChange';

/**
 * The default value accessor.
 */
const elementValueAccessor = createElementValueAccessor();

/**
 * The plugin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledPlugin {
  /**
   * @internal
   */
  ['__plugin']: unknown;

  /**
   * @internal
   */
  ['value']: unknown;

  /**
   * The array of that are used to derive the field value. Update this array by calling {@link track} method. Elements
   * are watched by {@link MutationObserver} and removed from this array when they are removed from the DOM.
   */
  ['trackedElements']: Element[];

  /**
   * The accessor that reads and writes field value from and to {@link trackedElements tracked elements}.
   */
  ['elementValueAccessor']: ElementValueAccessor;

  /**
   * The adds the DOM element to the list of tracked elements.
   *
   * @param element The element to track. No-op if the element is `null` or not connected to the DOM.
   */
  track(element: Element | null): void;

  /**
   * Overrides {@link elementValueAccessor the element value accessor} for the field.
   *
   * @param accessor The accessor to use for this filed.
   */
  setElementValueAccessor(accessor: Partial<ElementValueAccessor>): this;

  /**
   * Subscribes the listener to additions and deletions in of {@link trackedElements tracked elements}.
   *
   * @param eventType The type of the event.
   * @param listener The listener that would be triggered.
   * @returns The callback to unsubscribe the listener.
   */
  on(
    eventType: 'trackedElementsChange',
    listener: (event: FieldEvent<this['__plugin'], this['value']>) => void
  ): () => void;

  /**
   * Associates the field with {@link element the DOM element}. This method is usually exposed by plugins that use DOM
   * element references. This method is invoked when {@link trackedElements the first tracked element} is changed.
   */
  ['refCallback']?(element: Element | null): void;
}

export interface TrackedElementsChangeEvent<Plugin = unknown, Value = any> extends FieldEvent<Plugin, Value> {
  type: 'trackedElementsChange';

  /**
   * The element that was added or removed from {@link trackedElements tracked elements}.
   */
  element: Element;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 *
 * @param defaultAccessor The accessor that reads and writes value to and from the DOM elements managed by the filed.
 */
export function uncontrolledPlugin(defaultAccessor = elementValueAccessor): PluginCallback<UncontrolledPlugin> {
  return field => {
    field.trackedElements = [];
    field.elementValueAccessor = defaultAccessor;

    const mutationObserver = new MutationObserver(mutations => {
      const events: TrackedElementsChangeEvent[] = [];
      const { trackedElements } = field;
      const [element] = trackedElements;

      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; ++i) {
          const elementIndex = trackedElements.indexOf(mutation.removedNodes.item(i) as Element);

          if (elementIndex === -1) {
            continue;
          }
          const element = trackedElements[elementIndex];
          element.removeEventListener('input', changeListener);
          element.removeEventListener('change', changeListener);

          trackedElements.splice(elementIndex, 1);
          events.push({ type: EVENT_TRACK, target: field as Field<any>, currentTarget: field as Field<any>, element });
        }
      }

      if (trackedElements.length === 0) {
        mutationObserver.disconnect();
        field.refCallback?.(null);
      } else if (element !== trackedElements[0]) {
        field.refCallback?.(trackedElements[0]);
      }

      dispatchEvents(events);
    });

    const changeListener = (event: Event): void => {
      let value;
      if (
        field.trackedElements.indexOf(event.target as Element) !== -1 &&
        !isDeepEqual((value = field.elementValueAccessor.get(field.trackedElements)), field.value)
      ) {
        field.setValue(value);
      }
    };

    field.on('valueChange', () => {
      if (field.trackedElements.length !== 0) {
        field.elementValueAccessor.set(field.trackedElements, field.value);
      }
    });

    field.track = element => {
      const { trackedElements } = field;

      if (
        element === null ||
        !(element instanceof Element) ||
        !element.isConnected ||
        trackedElements.indexOf(element) !== -1
      ) {
        return;
      }

      mutationObserver.observe(element.parentNode!, { childList: true });

      element.addEventListener('input', changeListener);
      element.addEventListener('change', changeListener);

      trackedElements.push(element);

      field.elementValueAccessor.set(trackedElements, field.value);

      if (trackedElements.length === 1) {
        field.refCallback?.(trackedElements[0]);
      }

      dispatchEvents([{ type: EVENT_TRACK, target: field, currentTarget: field, element }]);
    };

    field.setElementValueAccessor = accessor => {
      field.elementValueAccessor = {
        get: accessor.get || defaultAccessor.get,
        set: accessor.set || defaultAccessor.set,
      };
      return field;
    };
  };
}
