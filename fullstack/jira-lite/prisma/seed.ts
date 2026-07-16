import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = "demo@example.com";
  const password = await bcrypt.hash("password123", 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { name: "Demo User", email, password },
  });

  await prisma.todo.createMany({
    data: [
      { title: "Set up the project", completed: true, userId: user.id },
      { title: "Wire up authentication", completed: true, userId: user.id },
      { title: "Build the todo board", completed: false, userId: user.id },
      { title: "Deploy to production", completed: false, userId: user.id },
    ],
  });

  console.log(`Seeded demo user: ${email} / password123`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
