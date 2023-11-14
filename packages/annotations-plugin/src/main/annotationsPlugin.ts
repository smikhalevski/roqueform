import { callOrGet, dispatchEvents, Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from 'roqueform';

/**
 * The callback that applies patches to field annotations.
 *
 * @param annotations Annotations associated with this field.
 * @param patch The patch that must be applied to annotations.
 * @returns The new annotations object that contains original annotations that are partially overridden by the patch.
 * @template Annotations Annotations associated with fields.
 */
export type AnnotationsPatcher<Annotations extends object = { [annotation: string]: any }> = (
  annotations: Readonly<Annotations>,
  patch: Partial<Readonly<Annotations>>
) => Annotations;

const naturalAnnotationsPatcher: AnnotationsPatcher = (annotations, patch) => Object.assign({}, annotations, patch);

/**
 * The plugin added to fields by the {@link annotationsPlugin}.
 *
 * @template Annotations Annotations associated with fields.
 */
export interface AnnotationsPlugin<Annotations extends object = { [annotation: string]: any }> {
  /**
   * Annotations associated with this field.
   */
  annotations: Readonly<Annotations>;

  /**
   * The callback that applies patches to field annotations.
   */
  annotationsPatcher: AnnotationsPatcher<Annotations>;

  /**
   * Updates annotations of this field.
   *
   * @param patch The patch that is applied to current annotations, or a callback that receives the current annotations
   * and returns a patch that must be applied. A patch is applied using {@link annotationsPatcher}.
   */
  annotate(patch: Partial<Annotations> | ((annotations: Readonly<Annotations>) => Partial<Annotations>)): void;

  /**
   * Updates annotations of this field and all of its child fields.
   *
   * @param patch The patch that is applied to current annotations, or a callback that receives the current annotations
   * and returns a patch that must be applied. A patch is applied using {@link annotationsPatcher}.
   */
  annotateAll(patch: Partial<Annotations> | ((annotations: Readonly<Annotations>) => Partial<Annotations>)): void;

  /**
   * Subscribes to changes of {@link AnnotationsPlugin.annotations the field annotations}.
   *
   * @param eventType The type of the event.
   * @param subscriber The subscriber that would be triggered.
   * @returns The callback to unsubscribe the subscriber.
   */
  on(eventType: 'change:annotations', subscriber: Subscriber<PluginOf<this>, Annotations>): Unsubscribe;
}

/**
 * Enhances fields with methods that manage annotations.
 *
 * @param patcher The callback that applies patches to field annotations. By default, patches are applied using
 * [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
 * @template Annotations Annotations associated with fields.
 */
export function annotationsPlugin<Annotations extends object = { [annotation: string]: any }>(
  patcher?: AnnotationsPatcher<Partial<Annotations>>
): PluginInjector<AnnotationsPlugin<Partial<Annotations>>>;

/**
 * Enhances fields with methods that manage annotations.
 *
 * @param annotations The initial annotations that are associated with fields.
 * @param patcher The callback that applies patches to field annotations. By default, patches are applied using
 * [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
 * @template Annotations Annotations associated with fields.
 */
export function annotationsPlugin<Annotations extends object = { [annotation: string]: any }>(
  annotations: Annotations,
  patcher?: AnnotationsPatcher<Annotations>
): PluginInjector<AnnotationsPlugin<Annotations>>;

export function annotationsPlugin(
  annotations: AnnotationsPatcher | object = {},
  patcher = naturalAnnotationsPatcher
): PluginInjector<AnnotationsPlugin> {
  if (typeof annotations === 'function') {
    patcher = annotations as AnnotationsPatcher;
    annotations = {};
  }

  return field => {
    field.annotations = annotations;
    field.annotationsPatcher = patcher;

    field.annotate = patch => dispatchEvents(annotate(field, field, patch, false, []));

    field.annotateAll = patch => dispatchEvents(annotate(field, field, patch, true, []));
  };
}

function annotate(
  target: Field<AnnotationsPlugin>,
  origin: Field<AnnotationsPlugin>,
  patch: object | ((annotations: object) => object),
  deep: boolean,
  events: Event[]
): Event[] {
  events.push({ type: 'change:annotations', target, origin, data: target.annotations });

  target.annotations = target.annotationsPatcher(target.annotations, callOrGet(patch, target.annotations));

  if (deep && target.children !== null) {
    for (const child of target.children) {
      annotate(child, origin, patch, deep, events);
    }
  }
  return events;
}
