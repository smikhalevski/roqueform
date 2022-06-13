import {SetStateAction} from 'react';
import {callOrGet} from './utils';

export interface Accessor<U, V> {

  get(upstreamValue: U): V;

  set(upstreamValue: U, value: V): U;
}

/**
 * The form object that holds the value and the upstream.
 */
export class FormObject<U, V = U> {

  /**
   * The current form object value. This value may not be visible to the {@link upstream} yet if the value is
   * {@link staged}.
   */
  value!: V;

  /**
   * `true` if the {@link upstream} wasn't notified about the latest change yet.
   */
  staged = false;

  /**
   * The list of downstream form objects that derive their values from this form object.
   */
  private _downstream: FormObject<V, any>[] | undefined;

  /**
   * Creates the new {@link FormObject} instance.
   *
   * @param _listener The callback that is invoked if the value of this form changes.
   * @param upstream The upstream form object that incorporates the value of this form object, or `undefined` if there's
   * no upstream form object.
   * @param _accessor The optional accessor that reads the value from the upstream.
   * @param _transient If `true` then listener isn't called if the downstream value changes.
   */
  constructor(private _listener: () => void, public upstream?: FormObject<any, U>, private _accessor?: Accessor<U | undefined, V>, private _transient = false) {
    if (!upstream) {
      return;
    }

    const upstreamValue = upstream.value;
    this.value = _accessor ? _accessor.get(upstreamValue) : upstreamValue as unknown as V;

    (upstream._downstream ||= []).push(this);
  }

  /**
   * Sets the new value to the form object, sets {@link staged} to `false`, and notifies both the {@link upstream} and
   * downstream forms (if any) about the change.
   *
   * @param value The value to set.
   */
  setValue = (value: SetStateAction<V>): void => {
    this._propagateValue(callOrGet(value, this.value), false);
  };

  /**
   * Sets the new value to the form object and notifies the downstream forms about the change. The form object becomes
   * staged, so incoming updates from the {@link upstream} are ignored until {@link pushToUpstream} is called.
   *
   * @param value The value to set.
   */
  stageValue = (value: SetStateAction<V>): void => {
    this._propagateValue(callOrGet(value, this.value), true);
  };

  /**
   * Notifies the {@link upstream} about the staged change. No-op if the form object isn't staged.
   */
  pushToUpstream = (): void => {
    this._propagateValue(this.value, false);
  };

  /**
   * Detaches the form object from the upstream.
   */
  detach(): void {
    // If there's an upstream then this form object must be in its downstream
    this.upstream?._downstream?.splice(this.upstream._downstream.indexOf(this), 1);
    this.upstream = undefined;
  }

  /**
   * Propagates value downstream from the closest non-staged upstream.
   *
   * @param value The value of this form object that must be propagated.
   * @param staged If this form object must be marked as staged.
   * @private
   */
  private _propagateValue(value: V, staged: boolean): void {
    this.staged = staged;

    if (Object.is(value, this.value)) {
      // Unchanged value
      return;
    }

    let formObject: FormObject<any> = this;

    while (formObject.upstream && !formObject.staged) {
      const {_accessor} = formObject;
      formObject = formObject.upstream;
      value = _accessor ? _accessor.set(formObject.value, value) : value;
    }

    formObject._update(this, value);
  }

  /**
   * Notifies downstream about the incoming update.
   *
   * @param originFormObject The form object that started the update propagation.
   * @param value The updated value of this form object.
   * @private
   */
  private _update(originFormObject: FormObject<any>, value: any): void {

    if (Object.is(value, this.value)) {
      // No change
      return;
    }

    this.value = value;

    if (this._downstream) {
      for (const formObject of this._downstream) {
        if (formObject.staged) {
          continue;
        }
        const {_accessor} = formObject;
        formObject._update(originFormObject, _accessor ? _accessor.get(value) : value);
      }
    }

    if (this === originFormObject || !this._transient) {
      this._listener();
    }
  }
}
