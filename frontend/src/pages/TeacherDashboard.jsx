import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../lib/auth";
import { AppShell, Notice, Panel, Pill } from "../components/ui";

const asList = (d) => (Array.isArray(d) ? d : d?.results ?? []);
const todayName = () =>
  ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
const hhmm = (t) => (t || "").slice(0, 5);
const fmtTime = (t) => {
  if (!t) return "";
  const [h, m] = t.split(":");
  const hh = Number(h);
  return (hh % 12 || 12) + ":" + m + " " + (hh >= 12 ? "PM" : "AM");
};

export default function TeacherDashboard() {
  const { session } = useAuth();
  const [subjects, setSubjects] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [hasAttendanceClass, setHasAttendanceClass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [subj, tt, tk, cls] = await Promise.all([
        api.listSubjects(),
        api.listTimetable().catch(() => []),
        api.listTeacherTasks().catch(() => []),
        api.attendanceClasses().catch(() => []),
      ]);
      setSubjects(asList(subj));
      setTimetable(asList(tt));
      setTasks(asList(tk));
      setHasAttendanceClass(asList(cls).length > 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const today = todayName();
  const todayLectures = timetable
    .filter((s) => s.day_of_week === today)
    .sort((a, b) => hhmm(a.start_time).localeCompare(hhmm(b.start_time)));
  const openTasks = tasks.filter((t) => !t.is_done);

  return (
    <AppShell
      title={`Welcome, ${session?.username}`}
      subtitle="Your subjects, today's lectures, and open tasks."
    >
      <Notice>{error}</Notice>

      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <a href="/teacher/marks" className="group block min-w-0 overflow-hidden rounded-2xl border border-keen-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="h-1 w-full bg-gradient-to-r from-[#17E0E4] to-[#0AA9D4]" />
          <div className="flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-keen-cyanSoft text-lg">📚</span>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-keen-muted">Subjects</p>
              <p className="mt-0.5 text-2xl font-extrabold text-keen-charcoal">{loading ? "-" : subjects.length}</p>
            </div>
            <span className="text-keen-muted transition group-hover:translate-x-1 group-hover:text-[#0AA9D4]">&rarr;</span>
          </div>
          <div className="border-t border-keen-border px-5 py-2 text-xs font-bold text-[#0AA9D4]">Enter marks</div>
        </a>

        <a href="/timetable" className="group block min-w-0 overflow-hidden rounded-2xl border border-keen-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="h-1 w-full bg-gradient-to-r from-[#17E0E4] to-[#0AA9D4]" />
          <div className="flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-keen-cyanSoft text-lg">🗓️</span>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-keen-muted">Lectures today ({today})</p>
              <p className="mt-0.5 text-2xl font-extrabold text-keen-charcoal">{loading ? "-" : todayLectures.length}</p>
            </div>
            <span className="text-keen-muted transition group-hover:translate-x-1 group-hover:text-[#0AA9D4]">&rarr;</span>
          </div>
          <div className="border-t border-keen-border px-5 py-2 text-xs font-bold text-[#0AA9D4]">My timetable</div>
        </a>

        <a href="/teacher/tasks" className="group block min-w-0 overflow-hidden rounded-2xl border border-keen-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="h-1 w-full bg-gradient-to-r from-[#17E0E4] to-[#0AA9D4]" />
          <div className="flex items-center gap-3 p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-keen-cyanSoft text-lg">✅</span>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wide text-keen-muted">Open tasks</p>
              <p className="mt-0.5 text-2xl font-extrabold text-keen-charcoal">{loading ? "-" : openTasks.length}</p>
            </div>
            <span className="text-keen-muted transition group-hover:translate-x-1 group-hover:text-[#0AA9D4]">&rarr;</span>
          </div>
          <div className="border-t border-keen-border px-5 py-2 text-xs font-bold text-[#0AA9D4]">My tasks</div>
        </a>
      </div>

      {hasAttendanceClass && (
        <a href="/attendance" className="group mb-6 flex items-center gap-3 rounded-2xl border border-keen-border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-keen-cyanSoft text-lg">🧾</span>
          <span className="flex-1 font-bold text-keen-charcoal">Take attendance</span>
          <span className="text-keen-muted transition group-hover:translate-x-1 group-hover:text-[#0AA9D4]">&rarr;</span>
        </a>
      )}

      <Panel title={`Today's lectures (${today})`}>
        {loading ? (
          <p className="p-8 text-center text-xs font-medium text-keen-muted">Loading...</p>
        ) : todayLectures.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-bold text-keen-charcoal">No lectures today</p>
            <p className="mt-1 text-xs text-keen-muted">Nothing scheduled on the timetable for {today}.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-keen-muted uppercase text-[10px] font-bold border-b border-keen-border">
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Room</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {todayLectures.map((s) => (
                <tr key={s.id} className="hover:bg-keen-cyanSoft/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-keen-charcoal">
                    {fmtTime(s.start_time)} - {fmtTime(s.end_time)}
                  </td>
                  <td className="py-3 px-4 text-keen-charcoal">{s.subject_name}</td>
                  <td className="py-3 px-4 text-keen-muted">{s.class_label}</td>
                  <td className="py-3 px-4 text-keen-muted">{s.room || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <div className="mt-6">
        <Panel title={`${subjects.length} subjects assigned to you`}>
          {loading ? (
            <p className="p-8 text-center text-xs font-medium text-keen-muted">Loading...</p>
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
                  <th className="py-3 px-4 text-center">Marks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-keen-cyanSoft/40 transition-colors">
                    <td className="py-3 px-4 font-bold text-keen-charcoal">{s.name}</td>
                    <td className="py-3 px-4 text-keen-muted">{s.code || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <a href="/teacher/marks">
                        <Pill tone="brand">Enter marks</Pill>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>
    </AppShell>
  );
}