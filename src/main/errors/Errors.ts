import { Field } from '../Field';
import { EventBus } from '@smikhalevski/event-bus';

export class Errors<T> {
  private _eventBus = new EventBus();
  private _map = new Map<Field, T>();

  has(field: Field): boolean {
    return this._map.has(field);
  }

  get(field: Field): T | undefined {
    return this._map.get(field);
  }

  set(field: Field, error: T): void {
    this._map.set(field, error);
    this._eventBus.publish();
  }

  delete(field: Field): void {
    if (this._map.delete(field)) {
      this._eventBus.publish();
    }
  }

  clear(): void {
    this._map.clear();
    this._eventBus.publish();
  }

  subscribe(listener: () => void): () => void {
    return this._eventBus.subscribe(listener);
  }
}
