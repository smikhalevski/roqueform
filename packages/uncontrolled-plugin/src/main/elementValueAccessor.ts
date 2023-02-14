/**
 * Abstraction over DOM element value getter and setter.
 */
export interface ElementValueAccessor {
  /**
   * Retrieves value from the element.
   */
  get(elements: readonly Element[]): any;

  /**
   * Sets value to the element.
   */
  set(elements: readonly Element[], value: any): void;
}

/**
 * The opinionated element value accessor that applies following coercion rules:
 *
 * - Checkbox and radio inputs → boolean;
 * - Number → number, or `null` if empty;
 * - Range inputs → number;
 * - Date inputs → ISO formatted date, or `null` if empty;
 * - Image input → string value of the `src` attribute;
 * - File input → `File` or `null` if no file selected;
 * - Multi-file input → `FileList`;
 * - Others → `value` attribute, or `null` if element doesn't support it;
 * - `null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to `value` attribute.
 */
export const elementValueAccessor: ElementValueAccessor = {
  get(elements: any[]): any {
    if (elements.length === 0) {
      return undefined;
    }

    const element = elements[0];

    if (element.tagName !== 'INPUT') {
      return 'value' in element ? element.value : null;
    }

    const { type, valueAsNumber } = element;

    if (type === 'checkbox') {
      if (elements.length === 1) {
        return element.checked;
      }
      return elements.reduce<any[]>((values, element) => {
        if (element.tagName === 'INPUT' && element.type === 'checkbox' && element.checked) {
          values.push(element.value);
        }
        return values;
      }, []);
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
      return element.multiple ? element.files : element.files.length === 1 ? element.files.item(0) : null;
    }

    return element.value;
  },

  set(elements: any[], value: any): void {
    const element = elements[0];

    if (element.tagName !== 'INPUT') {
      if ('value' in element) {
        element.value = toSafeString(value);
      }
      return;
    }

    const { type } = element;

    if (type === 'checkbox') {
      for (const element of elements) {
        if (element.tagName === 'INPUT' && element.type === 'checkbox') {
          if (Array.isArray(value)) {
            element.checked = value.indexOf(element.value) !== -1;
          } else {
            element.checked = typeof value === 'boolean' ? value : element.value === value;
          }
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
      element.src = toSafeString(value);
      return;
    }
    if (type !== 'date') {
      element.value = toSafeString(value);
      return;
    }

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

function toSafeString(value: any): string {
  if (value === null || value === undefined || value !== value || value === Infinity || value === -Infinity) {
    return '';
  }
  return value;
}
