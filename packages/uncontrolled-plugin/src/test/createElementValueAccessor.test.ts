import { createElementValueAccessor } from '../main';

describe('createElementValueAccessor', () => {
  const accessor = createElementValueAccessor();

  function createElement(tagName: string, attributes?: object): any {
    return Object.assign(document.createElement(tagName), attributes);
  }

  describe('get', () => {
    test('returns value of the first element for non-input tags', () => {
      const value1 = accessor.get([createElement('textarea', { value: 'aaa' })]);
      const value2 = accessor.get([
        createElement('textarea', { value: 'aaa' }),
        createElement('input', { value: 'bbb' }),
      ]);

      expect(value1).toBe('aaa');
      expect(value2).toEqual('aaa');
    });

    test('returns boolean for a single checkbox by default', () => {
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: true })])).toBe(true);
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: false })])).toBe(false);
    });

    test('returns an array of checked values for multiple checkboxes by default', () => {
      expect(
        accessor.get([
          createElement('input', { type: 'checkbox', checked: true, value: 'aaa' }),
          createElement('input', { type: 'checkbox', checked: false, value: 'bbb' }),
          createElement('input', { type: 'checkbox', checked: true, value: 'ccc' }),
        ])
      ).toEqual(['aaa', 'ccc']);
    });

    test('returns boolean for a single checkbox for "auto" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'auto' });

      expect(accessor.get([createElement('input', { type: 'checkbox', checked: true, value: 'aaa' })])).toBe(true);
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: false, value: 'aaa' })])).toBe(false);
    });

    test('returns an array of checked values for multiple checkboxes for "auto" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'auto' });

      expect(
        accessor.get([
          createElement('input', { type: 'checkbox', checked: true, value: 'aaa' }),
          createElement('input', { type: 'checkbox', checked: false, value: 'bbb' }),
          createElement('input', { type: 'checkbox', checked: true, value: 'ccc' }),
        ])
      ).toEqual(['aaa', 'ccc']);
    });

    test('returns boolean for a single checkbox for "boolean" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'boolean' });

      expect(accessor.get([createElement('input', { type: 'checkbox', checked: true, value: 'aaa' })])).toBe(true);
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: false, value: 'aaa' })])).toBe(false);
    });

    test('returns an array of booleans for multiple checkboxes for "boolean" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'boolean' });

      expect(
        accessor.get([
          createElement('input', { type: 'checkbox', checked: true, value: 'aaa' }),
          createElement('input', { type: 'checkbox', checked: false, value: 'bbb' }),
          createElement('input', { type: 'checkbox', checked: true, value: 'ccc' }),
        ])
      ).toEqual([true, false, true]);
    });

    test('returns an array of booleans for a single checkbox for "booleanArray" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'booleanArray' });

      expect(accessor.get([createElement('input', { type: 'checkbox', checked: true, value: 'aaa' })])).toEqual([true]);
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: false, value: 'aaa' })])).toEqual([
        false,
      ]);
    });

    test('returns an array of booleans for multiple checkboxes for "booleanArray" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'booleanArray' });

      expect(
        accessor.get([
          createElement('input', { type: 'checkbox', checked: true, value: 'aaa' }),
          createElement('input', { type: 'checkbox', checked: false, value: 'bbb' }),
          createElement('input', { type: 'checkbox', checked: true, value: 'ccc' }),
        ])
      ).toEqual([true, false, true]);
    });

    test('returns value or null for a single checkbox for "value" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'value' });

      expect(accessor.get([createElement('input', { type: 'checkbox', checked: true, value: 'aaa' })])).toBe('aaa');
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: false, value: 'aaa' })])).toBeNull();
    });

    test('returns an array of values for multiple checkboxes for "value" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'value' });

      expect(
        accessor.get([
          createElement('input', { type: 'checkbox', checked: true, value: 'aaa' }),
          createElement('input', { type: 'checkbox', checked: false, value: 'bbb' }),
          createElement('input', { type: 'checkbox', checked: true, value: 'ccc' }),
        ])
      ).toEqual(['aaa', 'ccc']);
    });

    test('returns an array of values for a single checkbox for "valueArray" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'valueArray' });

      expect(accessor.get([createElement('input', { type: 'checkbox', checked: true, value: 'aaa' })])).toEqual([
        'aaa',
      ]);
      expect(accessor.get([createElement('input', { type: 'checkbox', checked: false, value: 'aaa' })])).toEqual([]);
    });

    test('returns an array of booleans for multiple checkboxes for "valueArray" format', () => {
      const accessor = createElementValueAccessor({ checkboxFormat: 'valueArray' });

      expect(
        accessor.get([
          createElement('input', { type: 'checkbox', checked: true, value: 'aaa' }),
          createElement('input', { type: 'checkbox', checked: false, value: 'bbb' }),
          createElement('input', { type: 'checkbox', checked: true, value: 'ccc' }),
        ])
      ).toEqual(['aaa', 'ccc']);
    });

    test('returns the value of the first checked radio', () => {
      expect(
        accessor.get([
          createElement('input', { type: 'radio', checked: false, value: 'aaa' }),
          createElement('input', { type: 'radio', checked: true, value: 'bbb' }),
          createElement('input', { type: 'radio', checked: false, value: 'ccc' }),
        ])
      ).toBe('bbb');
    });

    test('returns number for number and range inputs', () => {
      expect(accessor.get([createElement('input', { type: 'number', value: '111' })])).toBe(111);
      expect(accessor.get([createElement('input', { type: 'range', value: '33' })])).toBe(33);
    });

    test('returns null for empty number inputs', () => {
      expect(accessor.get([createElement('input', { type: 'number' })])).toBeNull();
    });

    test('returns default value for empty range inputs', () => {
      expect(accessor.get([createElement('input', { type: 'range' })])).toBe(50);
    });

    test('returns value for date input by default', () => {
      expect(accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })])).toBe('2023-02-15');
    });

    test('returns value for datetime-local inputs by default', () => {
      const value = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value).toBe('2023-02-15T15:31:05.312');
    });

    test('returns null for empty date inputs by default', () => {
      expect(accessor.get([createElement('input', { type: 'date' })])).toBeNull();
    });

    test('returns null for empty datetime-local inputs by default', () => {
      expect(accessor.get([createElement('input', { type: 'date' })])).toBeNull();
    });

    test('returns input value for date inputs for "value" format', () => {
      const accessor = createElementValueAccessor({ dateFormat: 'value' });

      const value1 = accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })]);
      const value2 = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value1).toBe('2023-02-15');
      expect(value2).toBe('2023-02-15T15:31:05.312');
    });

    test('returns ISO date for date inputs for "iso" format', () => {
      const accessor = createElementValueAccessor({ dateFormat: 'iso' });

      const value1 = accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })]);
      const value2 = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value1).toBe('2023-02-15T00:00:00.000Z');
      expect(value2).toBe('2023-02-15T15:31:05.312Z');
    });

    test('returns UTC date for date inputs for "utc" format', () => {
      const accessor = createElementValueAccessor({ dateFormat: 'utc' });

      const value1 = accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })]);
      const value2 = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value1).toBe('Wed, 15 Feb 2023 00:00:00 GMT');
      expect(value2).toBe('Wed, 15 Feb 2023 15:31:05 GMT');
    });

    test('returns GMT date for date inputs for "gmt" format', () => {
      const accessor = createElementValueAccessor({ dateFormat: 'gmt' });

      const value1 = accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })]);
      const value2 = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value1).toBe('Wed, 15 Feb 2023 00:00:00 GMT');
      expect(value2).toBe('Wed, 15 Feb 2023 15:31:05 GMT');
    });

    test('returns Date object for date inputs for "object" format', () => {
      const accessor = createElementValueAccessor({ dateFormat: 'object' });

      const value1 = accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })]);
      const value2 = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value1).toEqual(new Date('2023-02-15T00:00:00.000Z'));
      expect(value2).toEqual(new Date('2023-02-15T15:31:05.312Z'));
    });

    test('returns timestamp for date inputs for "timestamp" format', () => {
      const accessor = createElementValueAccessor({ dateFormat: 'timestamp' });

      const value1 = accessor.get([createElement('input', { type: 'date', valueAsNumber: 1676475065312 })]);
      const value2 = accessor.get([createElement('input', { type: 'datetime-local', valueAsNumber: 1676475065312 })]);

      expect(value1).toBe(1676419200000);
      expect(value2).toBe(1676475065312);
    });

    test('returns null for empty time inputs by default', () => {
      expect(accessor.get([createElement('input', { type: 'time' })])).toBeNull();
    });

    test('returns value for time inputs by default', () => {
      expect(accessor.get([createElement('input', { type: 'time', valueAsNumber: 12300000 })])).toBe('03:25');
    });

    test('returns value for time inputs for "value" format', () => {
      const accessor = createElementValueAccessor({ timeFormat: 'value' });

      expect(accessor.get([createElement('input', { type: 'time', valueAsNumber: 12300000 })])).toBe('03:25');
    });

    test('returns number for time inputs for "number" format', () => {
      const accessor = createElementValueAccessor({ timeFormat: 'number' });

      expect(accessor.get([createElement('input', { type: 'time', valueAsNumber: 12300000 })])).toBe(12300000);
    });

    test('returns src for image inputs', () => {
      expect(accessor.get([createElement('input', { type: 'image', src: 'aaa' })])).toBe('http://localhost/aaa');
    });

    test('returns null for empty file inputs', () => {
      expect(accessor.get([createElement('input', { type: 'file' })])).toBeNull();
    });

    test('returns an array for empty multi-file inputs', () => {
      expect(accessor.get([createElement('input', { type: 'file', multiple: true })])).toEqual([]);
    });
  });

  describe('set', () => {
    test('sets value fro non-input tags', () => {
      const element = createElement('textarea');

      accessor.set([element], 'aaa');

      expect(element.value).toBe('aaa');
    });

    test('does not set value for elements that do not support it', () => {
      const element = createElement('label');

      accessor.set([element], 'aaa');

      expect(element.value).toBeUndefined();
    });

    test('sets checkboxes checked state from an array of booleans', () => {
      const element1 = createElement('input', { type: 'checkbox' });
      const element2 = createElement('input', { type: 'checkbox' });
      const element3 = createElement('input', { type: 'checkbox' });

      accessor.set([element1, element2, element3], [true, false, true]);

      expect(element1.checked).toBe(true);
      expect(element2.checked).toBe(false);
      expect(element3.checked).toBe(true);
    });

    test('sets checkboxes checked state from an array of values', () => {
      const element1 = createElement('input', { type: 'checkbox', value: 'aaa' });
      const element2 = createElement('input', { type: 'checkbox', value: 'bbb' });
      const element3 = createElement('input', { type: 'checkbox', value: 'ccc' });

      accessor.set([element1, element2, element3], ['aaa', 'ccc']);

      expect(element1.checked).toBe(true);
      expect(element2.checked).toBe(false);
      expect(element3.checked).toBe(true);
    });

    test('sets checkboxes checked state from a string', () => {
      const element1 = createElement('input', { type: 'checkbox', value: 'aaa' });
      const element2 = createElement('input', { type: 'checkbox', value: 'bbb' });
      const element3 = createElement('input', { type: 'checkbox', value: 'ccc' });

      accessor.set([element1, element2, element3], 'bbb');

      expect(element1.checked).toBe(false);
      expect(element2.checked).toBe(true);
      expect(element3.checked).toBe(false);
    });

    test('sets checkboxes checked state from a boolean', () => {
      const element1 = createElement('input', { type: 'checkbox' });
      const element2 = createElement('input', { type: 'checkbox' });
      const element3 = createElement('input', { type: 'checkbox' });

      accessor.set([element1, element2, element3], true);

      expect(element1.checked).toBe(true);
      expect(element2.checked).toBe(true);
      expect(element3.checked).toBe(true);
    });

    test('unchecks a checkbox if value is not a string or boolean', () => {
      const element = createElement('input', { type: 'checkbox', checked: true });

      accessor.set([element], 111);

      expect(element.checked).toBe(false);
    });

    test('sets radio checked state from a string', () => {
      const element1 = createElement('input', { type: 'radio', value: 'aaa' });
      const element2 = createElement('input', { type: 'radio', value: 'bbb' });
      const element3 = createElement('input', { type: 'radio', value: 'ccc' });

      accessor.set([element1, element2, element3], 'bbb');

      expect(element1.checked).toBe(false);
      expect(element2.checked).toBe(true);
      expect(element3.checked).toBe(false);
    });

    test('sets finite value as a number input value', () => {
      const element = createElement('input', { type: 'number' });

      accessor.set([element], '111');

      expect(element.valueAsNumber).toBe(111);
    });

    test('unsets a number input if non-finite value is provided', () => {
      const element = createElement('input', { type: 'number' });

      accessor.set([element], 'aaa');

      expect(element.valueAsNumber).toBe(NaN);
    });

    test('sets date as a date input value', () => {
      const element = createElement('input', { type: 'date' });

      accessor.set([element], new Date(1676475065312));

      expect(element.valueAsNumber).toBe(1676419200000);
    });

    test('sets number as a date input value', () => {
      const element = createElement('input', { type: 'date' });

      accessor.set([element], 1676475065312);

      expect(element.valueAsNumber).toBe(1676419200000);
    });

    test('sets finite value as a date input value', () => {
      const element = createElement('input', { type: 'date' });

      accessor.set([element], '1676475065312');

      expect(element.valueAsNumber).toBe(1676419200000);
    });

    test('sets ISO date as a date input value', () => {
      const element = createElement('input', { type: 'date' });

      accessor.set([element], '2023-02-15T15:31:05.312Z');

      expect(element.valueAsNumber).toBe(1676419200000);
    });

    test('unsets date input is value is invalid', () => {
      const element = createElement('input', { type: 'date', valueAsNumber: 1676419200000 });

      accessor.set([element], '2023-02-T15:31');

      expect(element.valueAsNumber).toBe(NaN);
    });

    test('sets number as a time input value', () => {
      const element = createElement('input', { type: 'time' });

      accessor.set([element], 12300000);

      expect(element.valueAsNumber).toBe(12300000);
    });

    test('sets string as a time input value', () => {
      const element = createElement('input', { type: 'time' });

      accessor.set([element], '03:25');

      expect(element.valueAsNumber).toBe(12300000);
    });
  });
});
