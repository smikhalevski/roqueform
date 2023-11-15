import { callOrGet, dispatchEvents, Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from 'roqueform';

/**
 * The callback that applies patches to field annotations.
 *
 * @param annotations Annotations associated with this field.
 * @param patch The patch that must be applied to annotations.
 * @returns The new annotations object that contains original annotations that are partially overridden by the patch, or
 * the original annotations object if nothing has changed.
 * @template Annotations Annotations associated with fields.
 */
export type AnnotationsMerger<Annotations extends object = { [annotation: string]: any }> = (
  annotations: Readonly<Annotations>,
  patch: Partial<Readonly<Annotations>>
) => Annotations;

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
  annotationsMerger: AnnotationsMerger<Annotations>;

  /**
   * Updates annotations of this field.
   *
   * @param patch The patch that is applied to current annotations, or a callback that receives the current annotations
   * and returns a patch that must be applied. A patch is applied using {@link annotationsMerger}.
   */
  annotate(patch: Partial<Annotations> | ((annotations: Readonly<Annotations>) => Partial<Annotations>)): void;

  /**
   * Updates annotations of this field and all of its child fields.
   *
   * @param patch The patch that is applied to current annotations, or a callback that receives the current annotations
   * and returns a patch that must be applied. A patch is applied using {@link annotationsMerger}.
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
 * @param annotationsMerger The callback that applies patches to field annotations. By default, patches are applied using
 * [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
 * @template Annotations Annotations associated with fields.
 */
export function annotationsPlugin<Annotations extends object = { [annotation: string]: any }>(
  annotationsMerger?: AnnotationsMerger<Partial<Annotations>>
): PluginInjector<AnnotationsPlugin<Partial<Annotations>>>;

/**
 * Enhances fields with methods that manage annotations.
 *
 * @param annotations The initial annotations that are associated with fields.
 * @param annotationsMerger The callback that applies patches to field annotations.
 * @template Annotations Annotations associated with fields.
 */
export function annotationsPlugin<Annotations extends object = { [annotation: string]: any }>(
  annotations: Annotations,
  annotationsMerger?: AnnotationsMerger<Annotations>
): PluginInjector<AnnotationsPlugin<Annotations>>;

export function annotationsPlugin(
  annotations: AnnotationsMerger | object = {},
  annotationsMerger = naturalAnnotationsMerger
): PluginInjector<AnnotationsPlugin> {
  if (typeof annotations === 'function') {
    annotationsMerger = annotations as AnnotationsMerger;
    annotations = {};
  }

  return field => {
    field.annotations = annotations;
    field.annotationsMerger = annotationsMerger;

    field.annotate = patch => dispatchEvents(annotate(field, field, patch, false, []));

    field.annotateAll = patch => dispatchEvents(annotate(field, field, patch, true, []));
  };
}

const naturalAnnotationsMerger: AnnotationsMerger = (prevAnnotations, patch) => {
  for (const key in patch) {
    if (patch[key] !== prevAnnotations[key]) {
      return Object.assign({}, prevAnnotations, patch);
    }
  }
  return prevAnnotations;
};

function annotate(
  originField: Field<AnnotationsPlugin>,
  targetField: Field<AnnotationsPlugin>,
  patch: object | ((annotations: object) => object),
  deep: boolean,
  events: Event[]
): Event[] {
  const prevAnnotations = targetField.annotations;
  const nextAnnotations = targetField.annotationsMerger(prevAnnotations, callOrGet(patch, targetField.annotations));

  if (prevAnnotations !== nextAnnotations) {
    targetField.annotations = nextAnnotations;
    events.push({ type: 'change:annotations', targetField, originField, data: prevAnnotations });
  }

  if (deep && targetField.children !== null) {
    for (const child of targetField.children) {
      annotate(originField, child, patch, deep, events);
    }
  }
  return events;
}
