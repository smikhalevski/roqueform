/**
 * Abstraction over DOM element value getter and setter.
 */
export interface ElementValueAccessor {
  /**
   * Retrieves value from elements that produce value for the field.
   *
   * @param elements The list of referenced elements, never empty.
   * @return The value that elements represent.
   */
  get(elements: readonly Element[]): any;

  /**
   * Sets value to elements controlled by the field.
   *
   * @param elements The list of referenced elements, never empty.
   * @param value The value to assign to elements.
   */
  set(elements: readonly Element[], value: any): void;
}

/**
 * The opinionated element value accessor that applies following coercion rules:
 *
 * - Single checkboxes → boolean;
 * - Multiple checkboxes → array of values of `value` attributes of checked checkboxes;
 * - Radio buttons → `value` attribute of a radio button that is checked or `null` if no radio buttons are checked;
 * - Number input → number, or `null` if empty;
 * - Range input → number;
 * - Date input → ISO formatted date, or `null` if empty;
 * - Image input → string value of the `src` attribute;
 * - File input → `File` or `null` if no file selected, file inputs are read-only;
 * - Multi-file input → array of `File`;
 * - Others → `value` attribute, or `null` if element doesn't support it;
 * - `null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to `value` attribute.
 */
export const elementValueAccessor: ElementValueAccessor = {
  get(elements: any[]): any {
    const element = elements[0];
    const { type, valueAsNumber } = element;

    if (element.tagName !== 'INPUT') {
      return 'value' in element ? element.value : null;
    }

    if (type === 'checkbox') {
      if (elements.length === 1) {
        return element.checked;
      }
      const values = [];
      for (const element of elements) {
        if (element.tagName === 'INPUT' && element.type === 'checkbox' && element.checked) {
          values.push(element.value);
        }
      }
      return values;
    }

    if (type === 'radio') {
      for (const element of elements) {
        if (element.tagName === 'INPUT' && element.type === 'radio' && element.checked) {
          return element.value;
        }
      }
      return null;
    }

    if (type === 'number' || type === 'range') {
      return valueAsNumber !== valueAsNumber ? null : valueAsNumber;
    }
    if (type === 'date') {
      return valueAsNumber !== valueAsNumber ? null : (element.valueAsDate || new Date(valueAsNumber)).toISOString();
    }
    if (type === 'image') {
      return element.src;
    }
    if (type === 'file') {
      return element.multiple ? toArray(element.files) : element.files.length === 1 ? element.files.item(0) : null;
    }

    return element.value;
  },

  set(elements: any[], value: any): void {
    const element = elements[0];
    const { type } = element;

    if (element.tagName !== 'INPUT') {
      if ('value' in element) {
        element.value = toString(value);
      }
      return;
    }

    if (type === 'checkbox') {
      for (const element of elements) {
        if (element.tagName === 'INPUT' && element.type === 'checkbox') {
          // prettier-ignore
          element.checked =
            Array.isArray(value) ? value.indexOf(element.value) !== -1 :
            typeof value === 'boolean' ? value :
            typeof value === 'string' ? element.value === value :
            false;
        }
      }
      return;
    }

    if (type === 'radio') {
      for (const element of elements) {
        if (element.tagName === 'INPUT' && element.type === 'radio') {
          element.checked = element.value === value;
        }
      }
      return;
    }

    if (type === 'number' || type === 'range') {
      if (isFinite(value)) {
        element.valueAsNumber = value;
      } else {
        element.value = '';
      }
      return;
    }
    if (type === 'image') {
      element.src = toString(value);
      return;
    }
    if (type === 'file') {
      return;
    }
    if (type !== 'date') {
      element.value = toString(value);
      return;
    }

    // Date input
    if (typeof value === 'string') {
      value = new Date(value);
    }
    if (isFinite(value)) {
      element.valueAsNumber = +value;
      return;
    }
    element.value = '';
  },
};

function toString(value: any): string {
  if (value === null || value === undefined || value !== value || value === Infinity || value === -Infinity) {
    return '';
  }
  return value;
}

function toArray(values: ArrayLike<any>): any[] {
  const arr = [];
  for (let i = 0; i < values.length; ++i) {
    arr.push(values[i]);
  }
  return arr;
}
