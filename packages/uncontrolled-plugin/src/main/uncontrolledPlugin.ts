import { createEvent, dispatchEvents, Event, PluginInjector, Subscriber, Unsubscribe } from 'roqueform';
import isDeepEqual from 'fast-deep-equal';
import { createElementValueAccessor, ElementValueAccessor } from './createElementValueAccessor';

const EVENT_CHANGE_OBSERVED_ELEMENTS = 'change:observedElements';

/**
 * The default value accessor.
 */
const elementValueAccessor = createElementValueAccessor();

/**
 * The plugin added to fields by the {@link uncontrolledPlugin}.
 */
export interface UncontrolledPlugin {
  /**
   * The array of elements that are used to derive the field value. Update this array by calling {@link observe} method.
   * Elements are observed by the {@link !MutationObserver MutationObserver} and deleted from this array when they are
   * removed from DOM.
   *
   * @protected
   */
  ['observedElements']: Element[];

  /**
   * The accessor that reads and writes field value from and to {@link observedElements observed elements}.
   *
   * @protected
   */
  ['elementValueAccessor']: ElementValueAccessor;

  /**
   * Adds the DOM element to {@link observedElements observed elements}.
   *
   * @param element The element to observe. No-op if the element is `null` or not connected to the DOM.
   */
  observe(element: Element | null): void;

  /**
   * Subscribes to updates of {@link observedElements observed elements}.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: 'change:observedElements', subscriber: Subscriber<this, Element>): Unsubscribe;

  /**
   * Associates the field with {@link element the DOM element}. This method is usually exposed by plugins that use DOM
   * element references. This method is invoked when {@link observedElements the first observed element} is changed.
   *
   * @protected
   */
  ['ref']?(element: Element | null): void;
}

/**
 * Updates field value when the DOM element value is changed and vice versa.
 *
 * @param accessor The accessor that reads and writes values to and from the DOM elements that
 * {@link UncontrolledPlugin.observedElements are observed by the filed}.
 */
export function uncontrolledPlugin(accessor = elementValueAccessor): PluginInjector<UncontrolledPlugin> {
  return field => {
    field.observedElements = [];
    field.elementValueAccessor = accessor;

    const mutationObserver = new MutationObserver(mutations => {
      const events: Event[] = [];
      const { observedElements } = field;

      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; ++i) {
          const elementIndex = observedElements.indexOf(mutation.removedNodes.item(i) as Element);

          if (elementIndex === -1) {
            continue;
          }

          const element = observedElements[elementIndex];

          element.removeEventListener('input', changeListener);
          element.removeEventListener('change', changeListener);

          observedElements.splice(elementIndex, 1);
          events.push(createEvent(EVENT_CHANGE_OBSERVED_ELEMENTS, field, element));
        }
      }

      if (observedElements.length === 0) {
        mutationObserver.disconnect();
        field.ref?.(null);
      } else {
        field.ref?.(observedElements[0]);
      }

      dispatchEvents(events);
    });

    const changeListener: EventListener = event => {
      let value;
      if (
        field.observedElements.indexOf(event.currentTarget as Element) !== -1 &&
        !isDeepEqual((value = field.elementValueAccessor.get(field.observedElements)), field.value)
      ) {
        field.setValue(value);
      }
    };

    field.on('change:value', () => {
      if (field.observedElements.length !== 0) {
        field.elementValueAccessor.set(field.observedElements, field.value);
      }
    });

    field.observe = element => {
      const { observedElements } = field;

      if (
        !(element instanceof Element) ||
        !element.isConnected ||
        element.parentNode === null ||
        observedElements.includes(element)
      ) {
        return;
      }

      mutationObserver.observe(element.parentNode, { childList: true });

      element.addEventListener('input', changeListener);
      element.addEventListener('change', changeListener);

      const elementCount = observedElements.push(element);

      field.elementValueAccessor.set(observedElements, field.value);

      if (elementCount === 1) {
        field.ref?.(element);
      }

      dispatchEvents([createEvent(EVENT_CHANGE_OBSERVED_ELEMENTS, field, element)]);
    };
  };
}
