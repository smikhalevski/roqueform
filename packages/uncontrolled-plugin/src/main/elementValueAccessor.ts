/**
 * Abstraction over DOM element value getter and setter.
 */
export interface ElementValueAccessor {
  /**
   * Retrieves value from the element.
   */
  get(element: Element): any;

  /**
   * Sets value to the element.
   */
  set(element: Element, value: any): void;
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
  get(element: any): any {
    if (element.tagName !== 'INPUT') {
      return 'value' in element ? element.value : null;
    }

    const { type, valueAsNumber } = element;

    if (type === 'checkbox' || type === 'radio') {
      return element.checked;
    }
    if (type === 'number' || type === 'range') {
      return valueAsNumber !== valueAsNumber ? null : valueAsNumber;
    }
    if (type === 'date') {
      return valueAsNumber !== valueAsNumber ? null : new Date(valueAsNumber).toISOString();
    }
    if (type === 'image') {
      return element.src;
    }
    if (type === 'file') {
      return element.multiple ? element.files : element.files.length === 1 ? element.files.item(0) : null;
    }

    return element.value;
  },

  set(element: any, value: any): void {
    if (element.tagName !== 'INPUT') {
      if ('value' in element) {
        element.value = toSafeString(value);
      }
      return;
    }

    const { type } = element;

    if (type === 'checkbox' || type === 'radio') {
      element.checked = value;
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

function toSafeString(value: any): boolean {
  return value == null || value !== value || value === Infinity || value === -Infinity ? '' : value;
}
