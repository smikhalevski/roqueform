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
  get(elements: readonly any[]): any;

  /**
   * Sets value to elements controlled by the field.
   *
   * @param elements The list of referenced elements, never empty.
   * @param value The value to assign to elements.
   */
  set(elements: readonly any[], value: any): void;
}

/**
 * Options applied to {@linkcode createElementValueAccessor}.
 */
export interface ElementValueAccessorOptions {
  /**
   * The date format read from input elements.
   *
   * @default "iso"
   */
  dateFormat?: 'timestamp' | 'iso' | 'utc' | 'gmt' | 'object';

  /**
   * The time format read from input elements.
   *
   * @default "string"
   */
  timeFormat?: 'number' | 'string';

  /**
   * The format of checkbox values.
   *
   * - `"boolean"` a single checkbox is a boolean, multiple checkboxes are an array of booleans.
   * - `"booleanArray"` an array of booleans.
   * - `"value"` a single checkbox is a `value` attribute if checked, or `null` if unchecked, multiple checkboxes are an
   * array of checked values.
   * - `"valueArray"` an array of `value` attributes.
   * - `"auto"` a single checkbox is a boolean, multiple checkboxes are an array of checked values.
   *
   * @default "auto"
   */
  checkboxFormat?: 'boolean' | 'booleanArray' | 'value' | 'valueArray' | 'auto';
}

/**
 * The opinionated element value accessor that applies following coercion rules, by default:
 *
 * - Single checkboxes → boolean, see {@linkcode ElementValueAccessorOptions.checkboxFormat};
 * - Multiple checkboxes → an array of `value` attributes of checked checkboxes, see
 * {@linkcode ElementValueAccessorOptions.checkboxFormat};
 * - Radio buttons → `value` attribute of a radio button that is checked or `null` if no radio buttons are checked;
 * - Number input → number, or `null` if empty;
 * - Range input → number;
 * - Date input → a valid `Date` object, or `null` if empty, see {@linkcode ElementValueAccessorOptions.dateFormat};
 * - Time input → a time string, or `null` if empty, see {@linkcode ElementValueAccessorOptions.timeFormat};
 * - Image input → string value of the `src` attribute;
 * - File input → `File` or `null` if no file selected, file inputs are read-only;
 * - Multi-file input → array of `File`;
 * - Others → `value` attribute, or `null` if element doesn't support it;
 * - `null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to `value` attribute.
 */
export function createElementValueAccessor(options?: ElementValueAccessorOptions): ElementValueAccessor {
  const get: ElementValueAccessor['get'] = elements => {
    const element = elements[0];
    const { type, valueAsNumber } = element;

    if (element.tagName !== 'INPUT') {
      return 'value' in element ? element.value : null;
    }

    if (type === 'checkbox') {
      const checkboxFormat = options?.checkboxFormat;

      if (elements.length === 1 && checkboxFormat !== 'booleanArray' && checkboxFormat !== 'valueArray') {
        return checkboxFormat !== 'value' ? element.checked : element.checked ? element.value : null;
      }

      const values = [];

      for (const element of elements) {
        if (element.tagName !== 'INPUT' || element.type !== 'checkbox') {
          continue;
        }
        if (checkboxFormat === 'boolean' || checkboxFormat === 'booleanArray') {
          values.push(element.checked);
          continue;
        }
        if (element.checked) {
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
      if (valueAsNumber !== valueAsNumber) {
        return null;
      }
      const date = element.valueAsDate || new Date(valueAsNumber);
      const dateFormat = options?.dateFormat;

      // prettier-ignore
      return (
        dateFormat === 'object' ? date :
        dateFormat === 'timestamp' ? valueAsNumber :
        dateFormat === 'utc' ? date.toUTCString() :
        dateFormat === 'gmt' ? date.toGMTString() :
        date.toISOString()
      );
    }

    if (type === 'time') {
      return valueAsNumber !== valueAsNumber ? null : options?.timeFormat === 'number' ? valueAsNumber : element.value;
    }
    if (type === 'image') {
      return element.src;
    }
    if (type === 'file') {
      return element.multiple ? toArray(element.files) : element.files.length === 1 ? element.files.item(0) : null;
    }

    return element.value;
  };

  const set: ElementValueAccessor['set'] = (elements, value) => {
    const element = elements[0];
    const { type } = element;

    if (element.tagName !== 'INPUT') {
      if ('value' in element) {
        element.value = toString(value);
      }
      return;
    }

    if (type === 'checkbox') {
      for (let i = 0; i < elements.length; ++i) {
        const element = elements[i];

        if (element.tagName !== 'INPUT' || element.type !== 'checkbox') {
          continue;
        }

        if (Array.isArray(value)) {
          element.checked = typeof value[i] === 'boolean' ? value[i] : value.indexOf(element.value) !== -1;
          continue;
        }

        element.checked =
          typeof value === 'boolean' ? value : typeof value === 'string' ? element.value === value : false;
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
    if (type === 'time') {
      if (isFinite(value)) {
        element.valueAsNumber = +value;
      } else {
        element.value = toString(value);
      }
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
  };

  return { get, set };
}

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
