import { AnyType, Issue, Type } from 'doubter';
import { Field, Plugin } from 'roqueform';

/**
 * The mixin added to fields by {@link doubterPlugin}.
 */
export interface DoubterPlugin {
  /**
   * Returns `true` if the field or any of its derived fields have an associated issue, or `false` otherwise.
   */
  isInvalid(): boolean;

  /**
   * Returns an issue associated with this field.
   */
  getIssue(): Partial<Issue> | null;

  /**
   * Associates an issue with this field and notifies the subscribers.
   *
   * @param issue The issue to set.
   */
  setIssue(issue: Partial<Issue>): void;

  /**
   * Deletes an issue associated with this field.
   */
  deleteIssue(): void;

  /**
   * Recursively deletes issues associated with this field and all of its derived fields.
   */
  clearIssues(): void;

  /**
   * Triggers field validation.
   */
  validate(): void;
}

/**
 * Enhances the field with validation methods that use {@link https://github.com/smikhalevski/doubter Doubter} runtime
 * type definitions.
 *
 * @param type The type definition that is used for validation.
 * @template T The type of the root field value.
 * @returns The plugin.
 */
export function doubterPlugin<T>(type: Type<T>): Plugin<T, DoubterPlugin> {
  return field => {
    enhanceField(field, type);
  };
}

/**
 * @internal
 * The property that holds a controller instance.
 *
 * **Note:** Controller isn't intended to be accessed outside the plugin internal functions.
 */
const CONTROLLER_SYMBOL = Symbol('doubterPlugin.controller');

/**
 * @internal
 * Retrieves a controller for the field instance.
 */
function getController(field: any): FieldController {
  return field[CONTROLLER_SYMBOL];
}

/**
 * @internal
 * The field controllers organise a tree that parallel to the tree of fields.
 */
interface FieldController {
  __parent: FieldController | null;
  __children: FieldController[] | null;
  __field: Field;
  __type: AnyType | null;
  __issueCount: number;
  __issue: Partial<Issue> | null;

  /**
   * `true` if an issue was set internally by {@link DoubterPlugin.validate}, or `false` if an issue was set from the
   * userland through {@link DoubterPlugin.setIssue}.
   */
  __internal: boolean;
}

/**
 * @internal
 * Enhances field with validation methods and adds a controller reference.
 *
 * @param field The field that should be enhanced, and for which the new controller is created.
 * @param type The type definition used for validation, ignored if parent is provided.
 */
function enhanceField(field: Field, type: AnyType | null): void {
  const controller: FieldController = {
    __parent: null,
    __children: null,
    __field: field,
    __type: type,
    __issueCount: 0,
    __issue: null,
    __internal: false,
  };

  if (field.parent !== null) {
    const parent = getController(field.parent);

    controller.__parent = parent;
    controller.__type = parent.__type && parent.__type.at(field.key);

    (parent.__children ||= []).push(controller);
  }

  Object.defineProperty(field, CONTROLLER_SYMBOL, { value: controller, enumerable: true });

  Object.assign<Field, DoubterPlugin>(field, {
    isInvalid() {
      return controller.__issueCount !== 0;
    },
    getIssue() {
      return controller.__issue;
    },
    setIssue(issue) {
      notifyControllers(setIssue(controller, issue, false, new Set()));
    },
    deleteIssue() {
      notifyControllers(deleteIssue(controller, false, new Set()));
    },
    clearIssues() {
      notifyControllers(clearIssues(controller, false, new Set()));
    },
    validate() {
      notifyControllers(validate(controller, new Set()));
    },
  });
}

/**
 * @internal
 * Associates an issue with the field.
 *
 * @param controller The controller for which an issue is set.
 * @param issue An issue to set.
 * @param internal If `true` then an issue is marked as internal.
 * @param updatedControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function setIssue(
  controller: FieldController,
  issue: Partial<Issue>,
  internal: boolean,
  updatedControllers: Set<FieldController>
): Set<FieldController> {
  updatedControllers.add(controller);

  controller.__internal = internal;

  if (controller.__issue !== null) {
    controller.__issue = issue;
    return updatedControllers;
  }

  controller.__issueCount++;
  controller.__issue = issue;

  for (let parent = controller.__parent; parent !== null; parent = parent.__parent) {
    if (parent.__issueCount++ === 0) {
      updatedControllers.add(parent);
    }
  }

  return updatedControllers;
}

/**
 * @internal
 * Deletes an issue associated with the field.
 *
 * @param controller The controller for which an issue must be deleted.
 * @param internal If `true` then only issues set by {@link DoubterPlugin.validate} are deleted.
 * @param updatedControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function deleteIssue(
  controller: FieldController,
  internal: boolean,
  updatedControllers: Set<FieldController>
): Set<FieldController> {
  if (controller.__issue === null || (internal && !controller.__internal)) {
    return updatedControllers;
  }

  controller.__issueCount--;
  controller.__issue = null;
  controller.__internal = false;

  updatedControllers.add(controller);

  for (let parent = controller.__parent; parent !== null && --parent.__issueCount === 0; parent = parent.__parent) {
    updatedControllers.add(parent);
  }

  return updatedControllers;
}

/**
 * @internal
 * Recursively deletes issues associated with this field and all of its derived fields.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only issues set by {@link DoubterPlugin.validate} are deleted.
 * @param updatedControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function clearIssues(
  controller: FieldController,
  internal: boolean,
  updatedControllers: Set<FieldController>
): Set<FieldController> {
  deleteIssue(controller, internal, updatedControllers);

  if (controller.__children === null) {
    return updatedControllers;
  }

  for (const child of controller.__children) {
    if (internal && child.__field.isTransient()) {
      continue;
    }
    clearIssues(child, internal, updatedControllers);
  }
  return updatedControllers;
}

/**
 * @internal
 * Validates a field value.
 *
 * @param controller The controller which field value should be validated.
 * @param updatedControllers The in-out set of controllers that were updated during the update propagation.
 * @returns The set of updated controllers.
 */
function validate(controller: FieldController, updatedControllers: Set<FieldController>): Set<FieldController> {
  if (controller.__type === null) {
    return updatedControllers;
  }

  clearIssues(controller, true, updatedControllers);

  const issues = controller.__type.validate(controller.__field.getValue());

  if (issues === null) {
    return updatedControllers;
  }

  issues: for (const issue of issues) {
    const { path } = issue;

    let field = controller.__field;

    for (let i = 0; i < path.length; ++i) {
      field = field.at(path[i]);

      if (field.isTransient()) {
        continue issues;
      }
    }

    for (let field = controller.__field; field.parent !== null; field = field.parent) {
      path.unshift(field.key);
    }

    setIssue(getController(field), issue, true, updatedControllers);
  }

  return updatedControllers;
}

function notifyControllers(controllers: Set<FieldController>): void {
  controllers.forEach(notifyController);
}

function notifyController(controller: FieldController): void {
  controller.__field.notify();
}
