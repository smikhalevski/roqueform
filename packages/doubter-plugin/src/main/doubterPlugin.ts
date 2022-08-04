import { AnyType, Issue, Type } from 'doubter';
import { Field, Plugin } from 'roqueform';

export interface DoubterPlugin<T> {
  /**
   * Returns `true` if the field or any of its derived fields have an associated validation issue, or `false` otherwise.
   */
  isInvalid(): boolean;

  /**
   * A validation issue associated with this field.
   */
  getIssue(): Partial<Issue> | null;

  /**
   * Associates an issue with this field and notifies the subscribers.
   *
   * @param issue The issue to set.
   */
  setIssue(issue: Partial<Issue>): void;

  /**
   * Deletes a validation issue associated with this field.
   */
  deleteIssue(): void;

  /**
   * Deletes validation issues associated with this field and all of its derived fields.
   */
  clearIssues(): void;

  /**
   * Triggers field validation.
   */
  validate(): void;
}

/**
 * Enhances the field with validation mechanism through a {@link https://github.com/smikhalevski/doubter Doubter}
 * runtime types.
 *
 * @param type The type definition that is used for validation.
 */
export function doubterPlugin<T>(type: Type<T>): Plugin<T, DoubterPlugin<T>> {
  return field => {
    if (field.parent !== null) {
      return;
    }
    return getOrCreateFieldController(null, field, type, 0, null).__field as Field<T, DoubterPlugin<T>> &
      DoubterPlugin<T>;
  };
}

interface FieldController {
  __parent: FieldController | null;
  __childrenMap: Map<unknown, FieldController> | null;
  __children: FieldController[] | null;
  __field: Field;
  __fieldType: AnyType | null;
  __pathLength: number;
  __key: unknown;
  __issueCount: number;
  __issue: Partial<Issue> | null;
  __internal: boolean;
  __at: (key: any) => Field;
  __notify: () => void;
  __isTransient: () => boolean;
}

function getOrCreateFieldController(
  parent: FieldController | null,
  rootField: Field | null,
  rootFieldType: AnyType | null,
  pathLength: number,
  key: any
): FieldController {
  let field = rootField!;
  let fieldType = rootFieldType instanceof Type ? rootFieldType : null;

  if (parent !== null) {
    const child = parent.__childrenMap?.get(key);

    if (child !== undefined) {
      return child;
    }

    field = parent.__at(key);
    fieldType = parent.__fieldType && parent.__fieldType.at(key);
  }

  const controller: FieldController = {
    __parent: parent,
    __childrenMap: null,
    __children: null,
    __field: field,
    __fieldType: fieldType,
    __pathLength: pathLength,
    __key: key,
    __issueCount: 0,
    __issue: null,
    __internal: false,
    __at: field.at,
    __notify: field.notify,
    __isTransient: field.isTransient,
  };

  field.at = key => getOrCreateFieldController(controller, null, null, pathLength + 1, key).__field;

  Object.assign<Field, DoubterPlugin<unknown>>(field, {
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

  if (parent !== null) {
    (parent.__childrenMap ||= new Map()).set(key, controller);
    (parent.__children ||= []).push(controller);
  }

  return controller;
}

/**
 * @internal
 * Sets an issues to the controller.
 *
 * @param controller The controller for which an issue is set.
 * @param issue An issue to set.
 * @param internal If `true` then an issue is set internally (not by a user).
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
 * Deletes an issue associated with the controller.
 *
 * @param controller The controller for which an issue must be deleted.
 * @param internal If `true` then only issues set internally (not by a user) are deleted.
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

  updatedControllers.add(controller);

  for (let parent = controller.__parent; parent !== null && --parent.__issueCount === 0; parent = parent.__parent) {
    updatedControllers.add(parent);
  }

  return updatedControllers;
}

/**
 * @internal
 * Recursively delete all issues in the controller tree.
 *
 * @param controller The controller tree root.
 * @param internal If `true` then only issues set internally (not by a user) are deleted.
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
    if (internal && child.__isTransient()) {
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
  if (controller.__fieldType === null) {
    return updatedControllers;
  }

  clearIssues(controller, true, updatedControllers);

  const issues = controller.__fieldType.validate(controller.__field.getValue());

  if (issues === null) {
    return updatedControllers;
  }

  const { __pathLength } = controller;

  issues: for (const issue of issues) {
    const { path } = issue;

    let targetController = controller;

    for (let i = __pathLength; i < path.length; ++i) {
      targetController = getOrCreateFieldController(controller, null, null, i, path[i]);

      if (targetController.__isTransient()) {
        continue issues;
      }
    }
    setIssue(targetController, issue, true, updatedControllers);
  }

  return updatedControllers;
}

function notifyControllers(controllers: Set<FieldController>): void {
  controllers.forEach(notifyController);
}

function notifyController(controller: FieldController): void {
  controller.__notify();
}
