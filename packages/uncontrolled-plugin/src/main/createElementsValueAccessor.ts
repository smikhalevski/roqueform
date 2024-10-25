/**
 * Abstraction over value getter and setter for a group of DOM elements.
 */
export interface ElementsValueAccessor {
  /**
   * Retrieves value from elements that produce value for the field.
   *
   * @param elements The array of referenced elements, never empty.
   * @return The value that elements represent.
   */
  get(elements: readonly any[]): any;

  /**
   * Sets value to elements controlled by the field.
   *
   * @param elements The array of referenced elements, never empty.
   * @param value The value to assign to elements.
   */
  set(elements: readonly any[], value: any): void;
}

/**
 * Options applied to {@link createElementsValueAccessor}.
 */
export interface ElementsValueAccessorOptions {
  /**
   * The format of checkbox values.
   *
   * <dl>
   *   <dt><i>"boolean"</i></dt>
   *   <dd><p>A single checkbox is a boolean, multiple checkboxes are an array of booleans.</p></dd>
   *
   *   <dt><i>"booleanArray"</i></dt>
   *   <dd><p>An array of booleans.</p></dd>
   *
   *   <dt><i>"value"</i></dt>
   *   <dd><p>A single checkbox is a
   *   <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value">value</a>
   *   attribute if checked, or <code>null</code> if unchecked, multiple checkboxes are an array of checked values.
   *   </p></dd>
   *
   *   <dt><i>"valueArray"</i></dt>
   *   <dd><p>An array of
   *   <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value">value</a>
   *   attributes.</p></dd>
   *
   *   <dt><i>"auto"</i></dt>
   *   <dd><p>A single checkbox is a boolean, multiple checkboxes are an array of checked values.</p></dd>
   * </dl>
   *
   * @default "auto"
   */
  checkboxFormat?: 'boolean' | 'booleanArray' | 'value' | 'valueArray' | 'auto';

  /**
   * The date format read from input elements.
   *
   * <dl>
   *   <dt><i>"object"</i></dt>
   *   <dd><p>A valid {@link !Date} instance, or <code>null</code> if empty.</p></dd>
   *
   *   <dt><i>"timestamp"</i></dt>
   *   <dd><p>A timestamp number.</p></dd>
   *
   *   <dt><i>"value"</i></dt>
   *   <dd><p>The
   *   <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#value">value</a>
   *   attribute, or <code>null</code> if empty.</p></dd>
   *
   *   <dt><i>"iso"</i></dt>
   *   <dd><p>An ISO date string.</p></dd>
   *
   *   <dt><i>"utc"</i></dt>
   *   <dd><p>A UTC date string.</p></dd>
   *
   *   <dt><i>"gmt"</i></dt>
   *   <dd><p>A GMT date string.</p></dd>
   * </dl>
   *
   * @default "value"
   */
  dateFormat?: 'object' | 'timestamp' | 'value' | 'iso' | 'utc' | 'gmt';

  /**
   * The time format read from input elements.
   *
   * <dl>
   *   <dt><i>"number"</i></dt>
   *   <dd><p>The number of milliseconds passed from the start of the day.</p></dd>
   *
   *   <dt><i>"value"</i></dt>
   *   <dd><p>The
   *   <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/time#value">value</a>
   *   attribute, or <code>null</code> if empty.</p></dd>
   * </dl>
   *
   * @default "value"
   */
  timeFormat?: 'number' | 'value';
}

/**
 * The opinionated element value accessor that applies following coercion rules.
 *
 * By default:
 *
 * - Single checkbox → boolean, see {@link ElementsValueAccessorOptions.checkboxFormat};
 * - Multiple checkboxes → an array of
 * <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/checkbox#value">value</a>
 * attributes of checked checkboxes, see {@link ElementsValueAccessorOptions.checkboxFormat};
 * - Radio buttons → the
 * <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/radio#value">value</a>
 * attribute of a radio button that is checked or `null` if no radio buttons are checked;
 * - Number input → number, or `null` if empty;
 * - Range input → number;
 * - Date input → the
 * <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/date#value">value</a>
 * attribute, or `null` if empty, see {@link ElementsValueAccessorOptions.dateFormat};
 * - Time input → a time string, or `null` if empty, see {@link ElementsValueAccessorOptions.timeFormat};
 * - Image input → string value of the
 * <a target="_blank" href="https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/image#src">value</a>
 * attribute;
 * - File input → {@link !File} or `null` if no file selected, file inputs are read-only;
 * - Multi-file input → array of {@link !File};
 * - Others → The _value_ attribute, or `null` if element doesn't support it;
 * - `null`, `undefined`, `NaN` and non-finite numbers are coerced to an empty string and written to _value_ attribute.
 */
export function createElementsValueAccessor(options: ElementsValueAccessorOptions = {}): ElementsValueAccessor {
  const { checkboxFormat, dateFormat, timeFormat } = options;

  const get: ElementsValueAccessor['get'] = elements => {
    const element = elements[0];
    const { type, valueAsNumber } = element;

    if (element.tagName !== 'INPUT') {
      return 'value' in element ? element.value : null;
    }

    if (type === 'checkbox') {
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

    if (type === 'date' || type === 'datetime-local') {
      if (valueAsNumber !== valueAsNumber) {
        return null;
      }

      const date = element.valueAsDate || new Date(valueAsNumber);

      // prettier-ignore
      return (
        dateFormat === 'object' ? date :
        dateFormat === 'timestamp' ? valueAsNumber :
        dateFormat === 'iso' ? date.toISOString() :
        dateFormat === 'utc' ? date.toUTCString() :
        dateFormat === 'gmt' ? date.toGMTString() :
        element.value
      );
    }

    if (type === 'time') {
      return valueAsNumber !== valueAsNumber ? null : timeFormat === 'number' ? valueAsNumber : element.value;
    }
    if (type === 'image') {
      return element.src;
    }
    if (type === 'file') {
      return element.multiple ? toArray(element.files) : element.files.length !== 0 ? element.files.item(0) : null;
    }

    return element.value;
  };

  const set: ElementsValueAccessor['set'] = (elements, value) => {
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

    if (type === 'date' || type === 'datetime-local') {
      let valueAsNumber;

      if (typeof value === 'string') {
        value = (valueAsNumber = +value) === valueAsNumber ? valueAsNumber : new Date(value).getTime();
      }
      if (isFinite(value)) {
        element.valueAsNumber = +value;
        return;
      }
      element.value = '';
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
    if (type === 'image') {
      element.src = toString(value);
      return;
    }
    if (type === 'file') {
      return;
    }

    element.value = toString(value);
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
