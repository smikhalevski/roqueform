import { callOrGet, dispatchEvents, Event, Field, PluginInjector, PluginOf, Subscriber, Unsubscribe } from 'roqueform';

interface ReadonlyDict {
  readonly [key: string]: any;
}

/**
 * Options of the {@link AnnotationsPlugin.annotate} method.
 */
export interface AnnotateOptions {
  /**
   * If `true` then patch is applied to this field and all of its descendant fields.
   *
   * @default false
   */
  recursive?: boolean;
}

/**
 * The plugin added to fields by the {@link annotationsPlugin}.
 *
 * @template Annotations Annotations associated with fields.
 */
export interface AnnotationsPlugin<Annotations extends object> {
  /**
   * Annotations associated with this field.
   */
  annotations: Annotations;

  /**
   * Updates annotations of this field.
   *
   * @param patch The patch that is applied to current annotations, or a callback that receives the current annotations
   * and returns a patch that must be applied.
   * @param options Additional options.
   */
  annotate(
    patch: Partial<Annotations> | ((field: PluginOf<this>) => Partial<Annotations>),
    options?: AnnotateOptions
  ): void;

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
 */
export function annotationsPlugin(): PluginInjector<AnnotationsPlugin<ReadonlyDict>>;

/**
 * Enhances fields with methods that manage annotations.
 *
 * @param annotations The initial annotations that are associated with fields.
 * @param applyPatch The callback that applies patches to field annotations. By default, patches are applied using
 * [Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign).
 * @template Annotations Annotations associated with fields.
 */
export function annotationsPlugin<Annotations extends object>(
  annotations: Annotations,
  /**
   * The callback that applies patches to field annotations.
   *
   * @param annotations Annotations associated with this field.
   * @param patch The patch that must be applied to annotations.
   * @returns The new annotations object that contains original annotations that are partially overridden by the patch,
   * or the original annotations object if nothing has changed.
   * @template Annotations Annotations associated with fields.
   */
  applyPatch?: (annotations: Readonly<Annotations>, patch: Readonly<Partial<Annotations>>) => Annotations
): PluginInjector<AnnotationsPlugin<Annotations>>;

export function annotationsPlugin(
  annotations = {},
  applyPatch = applyChanges
): PluginInjector<AnnotationsPlugin<ReadonlyDict>> {
  return field => {
    field.annotations = annotations;

    field.annotate = (patch, options) => dispatchEvents(annotate(field, patch, applyPatch, options, []));
  };
}

function applyChanges(annotations: ReadonlyDict, patch: ReadonlyDict): ReadonlyDict {
  for (const key in patch) {
    if (patch[key] !== annotations[key]) {
      return Object.assign(Object.create(Object.getPrototypeOf(annotations)), annotations, patch);
    }
  }
  return annotations;
}

function annotate(
  field: Field<AnnotationsPlugin<ReadonlyDict>>,
  patch: ReadonlyDict | ((annotations: ReadonlyDict) => ReadonlyDict),
  applyPatch: (annotations: ReadonlyDict, patch: ReadonlyDict) => ReadonlyDict,
  options: AnnotateOptions | undefined,
  events: Event[]
): Event[] {
  const prevAnnotations = field.annotations;
  const nextAnnotations = applyPatch(prevAnnotations, callOrGet(patch, field));

  if (prevAnnotations !== nextAnnotations) {
    field.annotations = nextAnnotations;
    events.push({ type: 'change:annotations', targetField: field, originField: field, data: prevAnnotations });
  }

  if (field.children !== null && options !== undefined && options.recursive) {
    for (const child of field.children) {
      annotate(child, patch, applyPatch, options, events);
    }
  }
  return events;
}
