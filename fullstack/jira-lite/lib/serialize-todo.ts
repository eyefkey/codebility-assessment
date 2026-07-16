import {
  canDeleteTodo,
  canEditTodo,
  canToggleTodo,
  type CurrentUser,
} from "@/lib/authorization";

type TodoWithOwner = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  userId: string;
  user: { id: string; name: string; groupId: string | null };
};

export function serializeTodo(todo: TodoWithOwner, viewer: CurrentUser) {
  const owner = { id: todo.user.id, groupId: todo.user.groupId };

  return {
    id: todo.id,
    title: todo.title,
    completed: todo.completed,
    createdAt: todo.createdAt.toISOString(),
    owner: { id: todo.user.id, name: todo.user.name },
    isOwner: todo.userId === viewer.id,
    permissions: {
      canToggle: canToggleTodo(viewer, owner),
      canEdit: canEditTodo(viewer, todo.userId),
      canDelete: canDeleteTodo(viewer, todo.userId),
    },
  };
}
