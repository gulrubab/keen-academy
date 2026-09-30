import { Link } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { AppShell, Pill } from "../components/ui";
import StudentAttendanceCard from "../components/StudentAttendanceCard";
import UpcomingExamsCard from "../components/UpcomingExamsCard";
import TestScoreTrendChart from "../components/TestScoreTrendChart";
import FeeStatusChart from "../components/FeeStatusChart";
import TodayClassesCard from "../components/TodayClassesCard";

function Card({ title, className = "", children }) {
  return (
    <section
      className={`min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${className}`}
    >
      <div className="h-1 w-full bg-gradient-to-r from-[#17E0E4] to-[#0AA9D4]" />
      <div className="p-4">
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">{title}</h3>
        <div className="[&_svg]:max-h-44 [&_svg]:w-full [&_canvas]:max-h-44 [&_img]:max-h-44">{children}</div>
      </div>
    </section>
  );
}

export default function StudentDashboard() {
  const { session } = useAuth();

  return (
    <AppShell
      title={`Welcome, ${session?.username}`}
      subtitle="Your attendance, exams, results and dues appear here as they are recorded."
      action={<Pill tone="ok">Account active</Pill>}
    >
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card title="Attendance"><StudentAttendanceCard /></Card>
          <Card title="Upcoming exams"><UpcomingExamsCard /></Card>
          <Card title="Fee status" className="md:col-span-2 xl:col-span-1"><FeeStatusChart /></Card>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card title="Test scores" className="xl:col-span-2"><TestScoreTrendChart /></Card>
          <Card title="Today's classes"><TodayClassesCard /></Card>
        </div>

        <div className="flex flex-wrap gap-3 pt-1">
          <Link to="/student/results" className="rounded-xl px-4 py-2 text-sm font-bold text-slate-900 hover:brightness-95" style={{ background: "#19D3F3" }}>
            View results
          </Link>
          <Link to="/student/fees" className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
            View fees
          </Link>
        </div>
      </div>
    </AppShell>
  );
}