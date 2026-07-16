import { describe, expect, it } from "vitest";

import { createTodoSchema, updateTodoSchema } from "@/lib/validations/todo";

describe("createTodoSchema", () => {
  it("accepts a valid title", () => {
    const result = createTodoSchema.safeParse({ title: "Buy milk" });
    expect(result.success).toBe(true);
  });

  it("trims the title", () => {
    const result = createTodoSchema.safeParse({ title: "  Buy milk  " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.title).toBe("Buy milk");
    }
  });

  it("rejects an empty title", () => {
    const result = createTodoSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a whitespace-only title", () => {
    const result = createTodoSchema.safeParse({ title: "   " });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 200 characters", () => {
    const result = createTodoSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("accepts a title at exactly 200 characters", () => {
    const result = createTodoSchema.safeParse({ title: "a".repeat(200) });
    expect(result.success).toBe(true);
  });

  it("rejects a missing title", () => {
    const result = createTodoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a non-string title", () => {
    const result = createTodoSchema.safeParse({ title: 123 });
    expect(result.success).toBe(false);
  });
});

describe("updateTodoSchema", () => {
  it("accepts just a status", () => {
    const result = updateTodoSchema.safeParse({ status: "IN_PROGRESS" });
    expect(result.success).toBe(true);
  });

  it("accepts just a title", () => {
    const result = updateTodoSchema.safeParse({ title: "Updated title" });
    expect(result.success).toBe(true);
  });

  it("accepts an empty object (no-op update)", () => {
    const result = updateTodoSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("rejects an empty title when provided", () => {
    const result = updateTodoSchema.safeParse({ title: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a title over 200 characters", () => {
    const result = updateTodoSchema.safeParse({ title: "a".repeat(201) });
    expect(result.success).toBe(false);
  });

  it("rejects a status that isn't one of the known pipeline stages", () => {
    const result = updateTodoSchema.safeParse({ status: "DONE" });
    expect(result.success).toBe(false);
  });
});
