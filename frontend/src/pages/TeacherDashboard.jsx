import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { AppShell, Notice, Panel, Pill } from "../components/ui";

export default function TeacherDashboard() {
  const { session } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listSubjects();
      setSubjects(Array.isArray(data) ? data : data?.results ?? []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AppShell
      title={`Welcome, ${session?.username}`}
      subtitle="Subjects assigned to you. Marks entry for each opens from here."
    >
      <Notice>{error}</Notice>
      <Panel title={`${subjects.length} subjects assigned to you`}>
        {loading ? (
          <p className="p-8 text-center text-xs font-medium text-keen-muted">Loading…</p>
        ) : subjects.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-keen-charcoal">No subjects assigned yet</p>
            <p className="mt-1 text-xs text-keen-muted">
              Ask the admin to assign you a subject from School Classes / Subjects.
            </p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-keen-muted uppercase text-[10px] font-bold border-b border-keen-border">
              <tr>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {subjects.map((s) => (
                <tr key={s.id} className="hover:bg-keen-cyanSoft/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-keen-charcoal">{s.name}</td>
                  <td className="py-3 px-4 text-keen-muted">{s.code || "—"}</td>
                  <td className="py-3 px-4 text-center">
                    <Pill tone="brand">Marks entry coming next</Pill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
      <p style={{ marginTop: 24 }}>
        <a href="/teacher/marks" style={{ fontWeight: 600 }}>Enter marks</a>
      </p>
      <p style={{ marginTop: 24 }}>
        <a href="/teacher/tasks" style={{ fontWeight: 600 }}>My tasks</a>
      </p>
    </AppShell>
  );
}

