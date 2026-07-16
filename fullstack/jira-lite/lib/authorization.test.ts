import { describe, expect, it } from "vitest";

import {
  canDeleteTodo,
  canEditTodo,
  canReadTodo,
  canToggleTodo,
  isAdmin,
  type CurrentUser,
} from "@/lib/authorization";

const admin: CurrentUser = { id: "admin-1", role: "ADMIN", groupId: null };
const owner: CurrentUser = { id: "user-1", role: "DEV", groupId: "group-a" };
const teammate: CurrentUser = { id: "user-2", role: "QA", groupId: "group-a" };
const outsider: CurrentUser = { id: "user-3", role: "DEV", groupId: "group-b" };
const noGroupUser: CurrentUser = { id: "user-4", role: "DEV", groupId: null };

const ownedTodo = { id: owner.id, groupId: owner.groupId };

describe("isAdmin", () => {
  it("is true only for the ADMIN role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(owner)).toBe(false);
  });
});

describe("canReadTodo / canToggleTodo", () => {
  it("allows the owner", () => {
    expect(canReadTodo(owner, ownedTodo)).toBe(true);
    expect(canToggleTodo(owner, ownedTodo)).toBe(true);
  });

  it("allows admin regardless of group", () => {
    expect(canReadTodo(admin, ownedTodo)).toBe(true);
    expect(canToggleTodo(admin, ownedTodo)).toBe(true);
  });

  it("allows a same-group teammate", () => {
    expect(canReadTodo(teammate, ownedTodo)).toBe(true);
    expect(canToggleTodo(teammate, ownedTodo)).toBe(true);
  });

  it("denies a user in a different group", () => {
    expect(canReadTodo(outsider, ownedTodo)).toBe(false);
    expect(canToggleTodo(outsider, ownedTodo)).toBe(false);
  });

  it("denies a user with no group, for another user's todo", () => {
    expect(canReadTodo(noGroupUser, ownedTodo)).toBe(false);
  });

  it("denies when both users have no group", () => {
    const otherNoGroupTodo = { id: "user-5", groupId: null };
    expect(canReadTodo(noGroupUser, otherNoGroupTodo)).toBe(false);
  });
});

describe("canEditTodo / canDeleteTodo", () => {
  it("allows the owner", () => {
    expect(canEditTodo(owner, owner.id)).toBe(true);
    expect(canDeleteTodo(owner, owner.id)).toBe(true);
  });

  it("allows admin", () => {
    expect(canEditTodo(admin, owner.id)).toBe(true);
    expect(canDeleteTodo(admin, owner.id)).toBe(true);
  });

  it("denies a same-group teammate (view/toggle only, not edit/delete)", () => {
    expect(canEditTodo(teammate, owner.id)).toBe(false);
    expect(canDeleteTodo(teammate, owner.id)).toBe(false);
  });

  it("denies an outsider", () => {
    expect(canEditTodo(outsider, owner.id)).toBe(false);
    expect(canDeleteTodo(outsider, owner.id)).toBe(false);
  });
});
