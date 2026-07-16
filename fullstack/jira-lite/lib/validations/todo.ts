import { TodoStatus } from "@prisma/client";
import { z } from "zod";

export const createTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long"),
});

export const updateTodoSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long").optional(),
  status: z.enum(TodoStatus).optional(),
});
