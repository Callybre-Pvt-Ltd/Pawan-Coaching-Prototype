import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import * as v from "valibot";
import { closeDb, getDb } from "../src/db";
import { users } from "../src/db/schema";
import { hashPassword } from "../src/features/auth/password";
import {
  createStudent,
  createTutor,
} from "../src/features/people/create-person";
import { tutorSubjectsSchema } from "../src/features/people/schemas";

for (const envFile of [".env", ".env.local"]) {
  try {
    process.loadEnvFile?.(envFile);
  } catch {
    // Ignore if file doesn't exist
  }
}

async function hiddenPrompt(label: string) {
  if (!stdin.isTTY)
    throw new Error("Provisioning requires an interactive terminal.");
  stdout.write(label);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  return new Promise<string>((resolve, reject) => {
    let value = "";
    const onData = (key: string) => {
      if (key === "\u0003") {
        cleanup();
        reject(new Error("Cancelled"));
        return;
      }
      if (key === "\r" || key === "\n") {
        cleanup();
        stdout.write("\n");
        resolve(value);
        return;
      }
      if (key === "\u007f" || key === "\b") {
        if (value) {
          value = value.slice(0, -1);
          stdout.write("\b \b");
        }
        return;
      }
      value += key;
      stdout.write("•");
    };
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
    };
    stdin.on("data", onData);
  });
}

async function main() {
  let details: ReturnType<typeof createInterface> | undefined;
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const role = (await rl.question("Role (admin/tutor/student): "))
      .trim()
      .toLowerCase();
    if (!(["admin", "tutor", "student"] as const).includes(role as "admin"))
      throw new Error("Role must be admin, tutor, or student.");
    const email = (await rl.question("Email: ")).trim().toLowerCase();
    rl.close();
    const password = await hiddenPrompt("Password (minimum 8 characters): ");
    if (password.length < 8)
      throw new Error("Password must be at least 8 characters.");
    details = createInterface({ input: stdin, output: stdout });
    const db = getDb();
    if (role === "admin") {
      await db.insert(users).values({
        email,
        passwordHash: await hashPassword(password),
        role: "admin",
      });
      stdout.write(`Created Admin account for ${email}.\n`);
      return;
    }
    const name = (await details.question("Full name: ")).trim();
    const dob = (await details.question("Date of birth (YYYY-MM-DD): ")).trim();
    const contactPhone = (
      await details.question(
        role === "student" ? "Student phone (optional): " : "Phone: ",
      )
    ).trim();
    if (role === "tutor") {
      const rawSubjects = (
        await details.question("Subjects (comma-separated): ")
      )
        .split(",")
        .map((subject) => subject.trim())
        .filter(Boolean);
      const parsedSubjects = v.safeParse(tutorSubjectsSchema, rawSubjects);
      if (!parsedSubjects.success)
        throw new Error("Add distinct subject names of 2 to 120 characters.");
      const result = await db.transaction((tx) =>
        createTutor(tx, {
          email,
          password,
          name,
          dob,
          contactPhone,
          subjects: parsedSubjects.output,
        }),
      );
      stdout.write(`Created Tutor ${result.tutorCode}.\n`);
      return;
    }
    const guardianName = (await details.question("Guardian name: ")).trim();
    const guardianContact = (await details.question("Guardian phone: ")).trim();
    const result = await db.transaction((tx) =>
      createStudent(tx, {
        email,
        password,
        name,
        dob,
        contactPhone,
        guardianName,
        guardianContact,
      }),
    );
    stdout.write(`Created Student ${result.studentCode}.\n`);
  } finally {
    rl.close();
    details?.close();
    await closeDb();
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
