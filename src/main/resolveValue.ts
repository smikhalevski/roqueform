import {ChangeEvent, SetStateAction} from 'react';

export function resolveValue(prevValue: unknown, value: ChangeEvent | SetStateAction<any>): unknown {
  if (!value || typeof value !== 'object' || !('preventDefault' in value)) {
    // Non-event object
    return value;
  }
  const element = value.target;

  if (!element) {
    // Malformed event
    return undefined;
  }

  if (element.tagName !== 'INPUT') {
    // select, textarea, datalist, or output
    return element.value;
  }

  const type = element.type;

  if (type === 'number' || type === 'range') {
    return element.valueAsNumber;
  }
  if (type === 'radio' || type === 'checkbox') {
    return element.checked;
  }
  // Other input types
  return element.value;
}
