import isDeepEqual from 'fast-deep-equal/es6/index.js';
import { Field, FieldEvent, FieldPlugin, InferMixin, InferValue } from '../Field.js';
import { isEqual, publishEvents } from '../utils.js';

/**
 * The mixin added to fields by the {@link resetPlugin}.
 */
export interface ResetMixin {
  /**
   * `true` if the field value is different from its initial value.
   */
  readonly isDirty: boolean;

  /**
   * Sets the initial value of the field and notifies ancestors and descendants.
   *
   * @param value The initial value to set.
   */
  setInitialValue(value: InferValue<this>): void;

  /**
   * Reverts the field to its initial value.
   */
  reset(): void;

  /**
   * Returns all fields that have {@link roqueform!BareField.value a value} that is different from
   * {@link roqueform!BareField.initialValue an initial value}.
   *
   * @see {@link isDirty}
   */
  getDirtyFields(): Field<any, InferMixin<this>>[];
}

/**
 * Enhances fields with methods that manage the initial value.
 *
 * @param equalityChecker The callback that compares initial value and the current value of the field. By default, the
 * deep comparison is used.
 */
export default function resetPlugin(
  equalityChecker: (initialValue: any, value: any) => boolean = isDeepEqual
): FieldPlugin<any, ResetMixin> {
  return field => {
    Object.defineProperty(field, 'isDirty', {
      configurable: true,

      get: () => !equalityChecker(field.initialValue, field.value),
    });

    field.setInitialValue = value => {
      setInitialValue(field, value);
    };

    field.reset = () => {
      field.setValue(field.initialValue);
    };

    field.getDirtyFields = () => getDirtyFields(field, []);
  };
}

function setInitialValue(field: Field<unknown, ResetMixin>, initialValue: unknown): void {
  if (isEqual(field.initialValue, initialValue)) {
    return;
  }

  let root = field;

  while (root.parentField !== null) {
    initialValue = field['_valueAccessor'].set(root.parentField.value, root.key, initialValue);
    root = root.parentField;
  }

  publishEvents(propagateInitialValue(root, field, initialValue, []));
}

function propagateInitialValue(
  target: Field<unknown, ResetMixin>,
  relatedTarget: Field<unknown, ResetMixin>,
  initialValue: unknown,
  events: FieldEvent[]
): FieldEvent[] {
  events.push({ type: 'initialValueChanged', target, relatedTarget, payload: target.initialValue });

  target.initialValue = initialValue;

  for (const child of target.children) {
    const childInitialValue = target['_valueAccessor'].get(initialValue, child.key);

    if (child !== relatedTarget && isEqual(child.initialValue, childInitialValue)) {
      continue;
    }

    propagateInitialValue(child, relatedTarget, childInitialValue, events);
  }

  return events;
}

function getDirtyFields(
  field: Field<unknown, ResetMixin>,
  batch: Field<unknown, ResetMixin>[]
): Field<unknown, ResetMixin>[] {
  if (field.isDirty) {
    batch.push(field);
  }

  for (const child of field.children) {
    getDirtyFields(child, batch);
  }

  return batch;
}
