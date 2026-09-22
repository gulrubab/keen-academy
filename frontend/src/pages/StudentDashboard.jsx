import { useAuth } from "../lib/auth";
import { AppShell, Panel, Pill } from "../components/ui";

export default function StudentDashboard() {
  const { session } = useAuth();

  const cards = [
    { label: "Attendance", value: "Ã¢â‚¬â€", note: "No records yet" },
    { label: "Latest Test", value: "Ã¢â‚¬â€", note: "No results published" },
    { label: "Fee Status", value: "Ã¢â‚¬â€", note: "Not set up yet" },
    { label: "Pending Homework", value: "Ã¢â‚¬â€", note: "No tasks assigned" },
  ];

  return (
    <AppShell
      title={`Welcome, ${session?.username}`}
      subtitle="Your account is active. Attendance, results and dues appear here as they are recorded."
      action={<Pill tone="ok">Account active</Pill>}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-keen-border rounded-2xl p-5 shadow-sm"
          >
            <span className="text-xs text-keen-muted font-bold uppercase tracking-wider">
              {card.label}
            </span>
            <p className="text-3xl font-black text-keen-charcoal my-2">{card.value}</p>
            <span className="text-[11px] font-bold text-keen-muted">{card.note}</span>
          </div>
        ))}
      </div>

      <Panel title="Today's Classes">
        <div className="p-10 text-center">
          <p className="text-sm font-bold text-keen-charcoal">No timetable yet</p>
          <p className="mt-1 text-xs text-keen-muted">
            Once the admin publishes the evening schedule, your classes show up here.
          </p>
        </div>
      </Panel>
      <p style={{ marginTop: 24 }}>
        <a href="/student/results" style={{ fontWeight: 600 }}>View results</a>
      </p>
      <p style={{ marginTop: 24 }}>
        <a href="/student/fees" style={{ fontWeight: 600 }}>View fees</a>
      </p>
    </AppShell>
  );
}
