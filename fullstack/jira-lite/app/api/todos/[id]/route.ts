import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateTodoSchema } from "@/lib/validations/todo";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateTodoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  const updated = await prisma.todo.update({
    where: { id },
    data: parsed.data,
  });

  return NextResponse.json({ todo: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const todo = await prisma.todo.findUnique({ where: { id } });
  if (!todo || todo.userId !== session.user.id) {
    return NextResponse.json({ error: "Todo not found" }, { status: 404 });
  }

  await prisma.todo.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
