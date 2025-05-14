import { Field, FieldEvent, FieldPlugin, InferMixin, InferValue } from '../Field.js';
import { callOrGet, publishEvents } from '../utils.js';

interface ReadonlyDict {
  readonly [key: string]: any;
}

/**
 * Options of the {@link AnnotationsMixin.annotate} method.
 */
export interface AnnotateOptions {
  /**
   * If `true` then patch is applied to this field and all of its descendant fields.
   *
   * @default false
   */
  isRecursive?: boolean;
}

/**
 * The mixin added to fields by the {@link annotationsPlugin}.
 *
 * @template Annotations Annotations associated with fields.
 */
export interface AnnotationsMixin<Annotations extends object> {
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
    patch: Partial<Annotations> | ((field: Field<InferValue<this>, InferMixin<this>>) => Partial<Annotations>),
    options?: AnnotateOptions
  ): void;
}

/**
 * Enhances fields with methods that manage annotations.
 */
export default function annotationsPlugin(): FieldPlugin<any, AnnotationsMixin<ReadonlyDict>>;

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
): FieldPlugin<any, AnnotationsMixin<Annotations>>;

export function annotationsPlugin(
  annotations = {},
  applyPatch = applyChanges
): FieldPlugin<any, AnnotationsMixin<ReadonlyDict>> {
  return field => {
    field.annotations = annotations;

    field.annotate = (patch, options) => {
      publishEvents(annotate(field, patch, applyPatch, options, []));
    };
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
  field: Field<unknown, AnnotationsMixin<ReadonlyDict>>,
  patch: ReadonlyDict | ((annotations: ReadonlyDict) => ReadonlyDict),
  applyPatch: (annotations: ReadonlyDict, patch: ReadonlyDict) => ReadonlyDict,
  options: AnnotateOptions | undefined,
  events: FieldEvent[]
): FieldEvent[] {
  const prevAnnotations = field.annotations;
  const nextAnnotations = applyPatch(prevAnnotations, callOrGet(patch, field));

  if (prevAnnotations !== nextAnnotations) {
    field.annotations = nextAnnotations;

    events.push(new FieldEvent('annotationsChanged', field, null));
  }

  if (field.children !== null && options !== undefined && options.isRecursive) {
    for (const child of field.children) {
      annotate(child, patch, applyPatch, options, events);
    }
  }
  return events;
}
