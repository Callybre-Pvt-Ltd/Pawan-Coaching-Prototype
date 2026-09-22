import { asc, eq } from "drizzle-orm";
import Link from "next/link";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { students, users } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";

export default async function StudentsPage() {
  await requireRole("admin");
  const rows = await getDb()
    .select({
      id: students.id,
      code: students.studentCode,
      name: students.name,
      phone: students.contactPhone,
      guardian: students.guardianName,
      status: users.status,
    })
    .from(students)
    .innerJoin(users, eq(students.userId, users.id))
    .orderBy(asc(students.name))
    .limit(25);
  return (
    <>
      <PageTitle
        eyebrow="People"
        title="Students"
        description="Search, enroll, and manage student records."
        action={{ label: "Add student", href: "/admin/students/new" }}
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No students yet"
            description="Add the first student to begin building batches, attendance, and fee records."
            action={{ label: "Add student", href: "/admin/students/new" }}
          />
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>ID</th>
                  <th>Guardian</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Action</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <Link href={`/admin/students/${student.id}`}>
                        <b>{student.name}</b>
                      </Link>
                      <span>{student.phone ?? "No student phone"}</span>
                    </td>
                    <td>{student.code}</td>
                    <td>{student.guardian}</td>
                    <td>
                      <span className="pill">
                        <span className="dot" />
                        {student.status}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="btn btn-ghost"
                        href={`/admin/students/${student.id}`}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
