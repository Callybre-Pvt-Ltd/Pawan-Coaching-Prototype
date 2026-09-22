import { asc } from "drizzle-orm";
import { EmptyState, PageTitle } from "@/components/dashboard-ui";
import { getDb } from "@/db";
import { batches } from "@/db/schema";
import { requireRole } from "@/features/auth/guards";
import { formatIndianDate } from "@/lib/utils";

export default async function Page() {
  await requireRole("admin");
  const rows = await getDb()
    .select()
    .from(batches)
    .orderBy(asc(batches.name))
    .limit(25);
  return (
    <>
      <PageTitle
        eyebrow="Academic operations"
        title="Batches"
        description="Build weekly schedules, assign tutors, and manage dated rosters."
        action={{ label: "Create batch", href: "/admin/batches/new" }}
      />
      <section className="panel surface">
        {rows.length === 0 ? (
          <EmptyState
            title="No batches yet"
            description="Create a batch once tutor and student profiles are ready."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Subject</th>
                  <th>Starts</th>
                  <th>Capacity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((batch) => (
                  <tr key={batch.id}>
                    <td>{batch.name}</td>
                    <td>{batch.subject}</td>
                    <td>{formatIndianDate(batch.startDate)}</td>
                    <td>{batch.capacity ?? "No limit"}</td>
                    <td>
                      <span className="pill">{batch.status}</span>
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
