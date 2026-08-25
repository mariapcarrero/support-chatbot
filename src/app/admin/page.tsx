import Link from "next/link";

import {
  clearAllEscalationsAction,
  clearAllLeadsAction,
  deleteEscalationAction,
  deleteLeadAction,
} from "@/app/admin/actions";
import {
  adminInboxSource,
  listRecentEscalations,
  listRecentLeads,
  type AdminEscalation,
  type AdminLead,
} from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Cadre AI — Demo ops inbox",
  description: "Leads and escalations captured by the support assistant. Delete to tidy for demos.",
};

/**
 * Demo ops inbox.
 *
 * Shows tool side effects as rows (CAD references, bookings, leads). Delete / clear are for
 * scrubbing test noise before a walkthrough — not a real ops workflow.
 */
export default async function AdminPage() {
  const [leadRows, escalationRows] = await Promise.all([
    listRecentLeads(),
    listRecentEscalations(),
  ]);
  const source = adminInboxSource();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-3 border-b border-border pb-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight text-fg">Demo ops inbox</h1>
          <Link
            href="/"
            className="text-sm text-info underline-offset-2 hover:underline"
          >
            Back to chat
          </Link>
        </div>
        <p className="max-w-2xl text-sm text-fg-muted">
          What the assistant recorded via tools — bookings, leads, and escalations (including
          portal access). Nothing here emails anyone. Use delete or clear to leave only the
          rows you want visible in a demo.
        </p>
        <p className="text-xs text-fg-subtle">
          {source.kind === "postgres" ? (
            <>
              Source: Postgres via{" "}
              <span className="font-mono text-fg">{source.connectionVar}</span>
            </>
          ) : (
            <>
              Source: in-process memory — your{" "}
              <span className="font-mono text-fg">DATABASE_URL</span> is missing or empty.
              Rows survive only inside this local server process. For durable local testing, set a
              real Neon URL (same as deploy). Check{" "}
              <Link href="/api/health" className="text-info underline-offset-2 hover:underline">
                /api/health
              </Link>
              .
            </>
          )}
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Escalations & portal requests"
          count={escalationRows.length}
          clearAction={escalationRows.length > 0 ? clearAllEscalationsAction : null}
          clearLabel="Clear all escalations"
        />
        {escalationRows.length === 0 ? (
          <EmptyState text="No escalations yet. Ask the chat for portal access or something it must hand off." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-fg-subtle">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Reference</th>
                  <th className="px-3 py-2.5 font-medium">Category</th>
                  <th className="px-3 py-2.5 font-medium">Reason</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">When</th>
                  <th className="px-3 py-2.5 font-medium">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {escalationRows.map((row) => (
                  <EscalationRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionHeading
          title="Bookings & leads"
          count={leadRows.length}
          clearAction={leadRows.length > 0 ? clearAllLeadsAction : null}
          clearLabel="Clear all leads"
        />
        {leadRows.length === 0 ? (
          <EmptyState text="No leads yet. Book a strategy call or leave contact details in chat." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-surface">
            <table className="w-full min-w-[44rem] text-left text-sm">
              <thead className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-fg-subtle">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Name</th>
                  <th className="px-3 py-2.5 font-medium">Email</th>
                  <th className="px-3 py-2.5 font-medium">Company</th>
                  <th className="px-3 py-2.5 font-medium">Interest</th>
                  <th className="px-3 py-2.5 font-medium">Source</th>
                  <th className="px-3 py-2.5 font-medium">When</th>
                  <th className="px-3 py-2.5 font-medium">
                    <span className="sr-only">Delete</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leadRows.map((row) => (
                  <LeadRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function SectionHeading({
  title,
  count,
  clearAction,
  clearLabel,
}: {
  title: string;
  count: number;
  clearAction: (() => Promise<void>) | null;
  clearLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <div className="flex items-baseline gap-2">
        <h2 className="text-lg font-medium text-fg">{title}</h2>
        <span className="text-xs text-fg-subtle">{count}</span>
      </div>
      {clearAction ? (
        <form action={clearAction}>
          <button
            type="submit"
            className="text-xs text-danger underline-offset-2 hover:underline"
          >
            {clearLabel}
          </button>
        </form>
      ) : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border bg-surface-muted px-4 py-8 text-sm text-fg-muted">
      {text}
    </p>
  );
}

function EscalationRow({ row }: { row: AdminEscalation }) {
  const remove = deleteEscalationAction.bind(null, row.id);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2.5 font-mono text-xs text-fg">{row.reference}</td>
      <td className="px-3 py-2.5 text-fg-muted">
        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-xs text-fg">
          {row.category}
        </span>
      </td>
      <td className="max-w-xs px-3 py-2.5 text-fg-muted">{row.reason}</td>
      <td className="px-3 py-2.5 text-fg">{row.contactEmail ?? "—"}</td>
      <td className="px-3 py-2.5">
        <StatusPill status={row.status} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-fg-subtle">{formatWhen(row.createdAt)}</td>
      <td className="px-3 py-2.5 text-right">
        <DeleteButton action={remove} />
      </td>
    </tr>
  );
}

function LeadRow({ row }: { row: AdminLead }) {
  const remove = deleteLeadAction.bind(null, row.id);
  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-3 py-2.5 font-medium text-fg">{row.name}</td>
      <td className="px-3 py-2.5 text-fg">{row.email}</td>
      <td className="px-3 py-2.5 text-fg-muted">{row.company ?? "—"}</td>
      <td className="max-w-xs px-3 py-2.5 text-fg-muted">{row.interest}</td>
      <td className="px-3 py-2.5">
        <span className="rounded bg-info-soft px-1.5 py-0.5 font-mono text-xs text-info">
          {row.sourceTool}
        </span>
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-fg-subtle">{formatWhen(row.createdAt)}</td>
      <td className="px-3 py-2.5 text-right">
        <DeleteButton action={remove} />
      </td>
    </tr>
  );
}

function DeleteButton({ action }: { action: () => Promise<void> }) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="text-xs text-fg-subtle underline-offset-2 hover:text-danger hover:underline"
      >
        Delete
      </button>
    </form>
  );
}

function StatusPill({ status }: { status: "open" | "resolved" }) {
  const open = status === "open";
  return (
    <span
      className={
        open
          ? "rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-accent"
          : "rounded-full bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
      }
    >
      {status}
    </span>
  );
}

function formatWhen(date: Date): string {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
