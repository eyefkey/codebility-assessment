import type { Role } from "@prisma/client";

export type CurrentUser = {
  id: string;
  role: Role;
  groupId: string | null;
};

type TodoOwner = {
  id: string;
  groupId: string | null;
};

export function isAdmin(subject: CurrentUser): boolean {
  return subject.role === "ADMIN";
}

function isTeammate(subject: CurrentUser, owner: TodoOwner): boolean {
  return (
    subject.id !== owner.id &&
    subject.groupId !== null &&
    subject.groupId === owner.groupId
  );
}

export function canReadTodo(subject: CurrentUser, owner: TodoOwner): boolean {
  if (isAdmin(subject)) return true;
  if (subject.id === owner.id) return true;
  return isTeammate(subject, owner);
}

export function canToggleTodo(subject: CurrentUser, owner: TodoOwner): boolean {
  return canReadTodo(subject, owner);
}

export function canEditTodo(subject: CurrentUser, ownerId: string): boolean {
  return isAdmin(subject) || subject.id === ownerId;
}

export function canDeleteTodo(subject: CurrentUser, ownerId: string): boolean {
  return isAdmin(subject) || subject.id === ownerId;
}
