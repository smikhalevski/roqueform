import {Field} from '../Field';
import {EventBus} from '@smikhalevski/event-bus';

export class Errors<T> {

  private _eventBus = new EventBus<Field>();
  private _errors = new Map<Field, T>();

  has(field: Field): boolean {
    return this._errors.has(field);
  }

  get(field: Field): T | undefined {
    return this._errors.get(field);
  }

  set(field: Field, error: T): void {
    this._errors.set(field, error);
    field.notify();
    this._eventBus.publish(field);
  }

  delete(field: Field): void {
    if (this._errors.delete(field)) {
      field.notify();
      this._eventBus.publish(field);
    }
  }

  clear(): void {
    const fields = Array.from(this._errors.keys());
    this._errors.clear();

    for (const field of fields) {
      field.notify();
      this._eventBus.publish(field);
    }
  }

  subscribe(listener: (field: Field) => void): () => void {
    return this._eventBus.subscribe(listener);
  }
}
