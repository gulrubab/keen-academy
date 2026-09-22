import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { AppShell } from "../components/ui";

const asList = (d) => (Array.isArray(d) ? d : d?.results ?? []);

const subjectLabel = (s) => {
  const name = s.name ?? s.title ?? `Subject ${s.id}`;
  const cls = s.school_class_name ?? s.class_name ?? s.school_class?.name;
  return cls ? `${name} (${cls})` : name;
};

export default function MarksEntry() {
  const [subjects, setSubjects] = useState([]);
  const [exams, setExams] = useState([]);
  const [subjectId, setSubjectId] = useState("");
  const [examId, setExamId] = useState("");
  const [totalMarks, setTotalMarks] = useState("100");
  const [students, setStudents] = useState([]);
  const [entries, setEntries] = useState({}); // { [userId]: "78" }
  const [markIds, setMarkIds] = useState({}); // { [userId]: existing Mark id }
  const [loadingBase, setLoadingBase] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let alive = true;
    Promise.all([api.listSubjects(), api.listExams()])
      .then(([subs, exs]) => {
        if (!alive) return;
        setSubjects(asList(subs));
        setExams(asList(exs));
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoadingBase(false));
    return () => {
      alive = false;
    };
  }, []);

  // Load the class list and any marks already saved for this subject + exam.
  useEffect(() => {
    setStudents([]);
    setEntries({});
    setMarkIds({});
    setNotice("");
    if (!subjectId || !examId) return;

    let alive = true;
    setLoadingRows(true);
    setError("");
    Promise.all([api.listSubjectStudents(subjectId), api.listMarks()])
      .then(([studs, marksData]) => {
        if (!alive) return;
        const existing = asList(marksData).filter(
          (m) => m.exam === Number(examId) && m.subject === Number(subjectId)
        );
        const vals = {};
        const ids = {};
        for (const m of existing) {
          vals[m.student] = String(Number(m.obtained_marks));
          ids[m.student] = m.id;
        }
        if (existing.length) setTotalMarks(String(Number(existing[0].total_marks)));
        setStudents(asList(studs));
        setEntries(vals);
        setMarkIds(ids);
      })
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoadingRows(false));
    return () => {
      alive = false;
    };
  }, [subjectId, examId]);

  const total = Number(totalMarks);
  const totalValid = Number.isFinite(total) && total > 0;
  const missingUserId = students.length > 0 && students.some((s) => s.user_id === undefined);

  const invalid = useMemo(() => {
    const bad = new Set();
    for (const s of students) {
      const raw = entries[s.user_id];
      if (raw === undefined || raw === "") continue;
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 0 || (totalValid && n > total)) bad.add(s.user_id);
    }
    return bad;
  }, [students, entries, total, totalValid]);

  const filled = students.filter(
    (s) => entries[s.user_id] !== undefined && entries[s.user_id] !== ""
  ).length;
  const canSave = !saving && totalValid && filled > 0 && invalid.size === 0 && !missingUserId;

  const setEntry = (userId, value) => {
    setNotice("");
    setEntries((prev) => ({ ...prev, [userId]: value }));
  };

  const save = async () => {
    setSaving(true);
    setError("");
    setNotice("");
    const ids = { ...markIds };
    const failed = [];
    let done = 0;

    for (const s of students) {
      const raw = entries[s.user_id];
      if (raw === undefined || raw === "") continue;
      const body = { obtained_marks: Number(raw), total_marks: total };
      try {
        if (ids[s.user_id]) {
          await api.updateMark(ids[s.user_id], body);
        } else {
          const created = await api.createMark({
            ...body,
            exam: Number(examId),
            subject: Number(subjectId),
            student: s.user_id,
          });
          ids[s.user_id] = created.id;
        }
        done += 1;
      } catch (e) {
        failed.push(`${s.full_name || s.username}: ${e.message}`);
      }
    }

    setMarkIds(ids);
    if (done) setNotice(`Saved marks for ${done} student${done === 1 ? "" : "s"}.`);
    if (failed.length) setError(`Could not save ${failed.length}: ${failed.join(" | ")}`);
    setSaving(false);
  };

  return (
    <AppShell
      title="Enter marks"
      subtitle="Pick a subject and an exam, then enter each student's marks."
    >
      <style>{css}</style>
      <div className="me">
        <div className="me-controls">
          <label>
            Subject
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              disabled={loadingBase}
            >
              <option value="">{loadingBase ? "Loading..." : "Select a subject"}</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {subjectLabel(s)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Exam
            <select
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              disabled={loadingBase}
            >
              <option value="">{loadingBase ? "Loading..." : "Select an exam"}</option>
              {exams.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} ({x.date})
                </option>
              ))}
            </select>
          </label>

          <label>
            Total marks
            <input
              type="number"
              min="1"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
            />
          </label>
        </div>

        {error && (
          <div className="me-msg me-err" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="me-msg me-ok" role="status">
            {notice}
          </div>
        )}

        {!loadingBase && subjects.length === 0 && (
          <p className="me-empty">No subjects are assigned to you yet. Ask the admin to assign one.</p>
        )}
        {!loadingBase && exams.length === 0 && (
          <p className="me-empty">No exams exist yet. Ask the admin to create one on the Exams page.</p>
        )}
        {loadingRows && <p className="me-empty">Loading students...</p>}

        {subjectId && examId && !loadingRows && students.length === 0 && !error && (
          <p className="me-empty">
            No registered students in this subject's class yet. Students appear here after they
            register with their roll number.
          </p>
        )}

        {missingUserId && (
          <div className="me-msg me-err" role="alert">
            The students endpoint is not returning user_id. Restart the Django server and reload
            this page.
          </div>
        )}

        {students.length > 0 && !missingUserId && (
          <>
            <div className="me-table-wrap">
              <table className="me-table">
                <thead>
                  <tr>
                    <th>Roll no.</th>
                    <th>Student</th>
                    <th className="num">Marks out of {totalValid ? total : "-"}</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const bad = invalid.has(s.user_id);
                    return (
                      <tr key={s.id}>
                        <td>{s.roll_no}</td>
                        <td>{s.full_name || s.username}</td>
                        <td className="num">
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max={totalValid ? total : undefined}
                            step="0.5"
                            value={entries[s.user_id] ?? ""}
                            onChange={(e) => setEntry(s.user_id, e.target.value)}
                            aria-label={`Marks for ${s.full_name || s.username}`}
                            aria-invalid={bad}
                            className={bad ? "bad" : ""}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="me-foot">
              <span>
                {filled} of {students.length} entered
                {invalid.size > 0 && ` - ${invalid.size} out of range`}
              </span>
              <button type="button" onClick={save} disabled={!canSave}>
                {saving ? "Saving..." : "Save marks"}
              </button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

const css = `
.me { --me-line: #d9dfe6; --me-muted: #5d6b7a; --me-accent: #1f4e8c; --me-bad: #b3261e; --me-ok: #1e6b3a; max-width: 820px; }
.me-controls { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 20px; }
.me-controls label { display: flex; flex-direction: column; gap: 6px; font-size: .9rem; font-weight: 600; }
.me-controls select, .me-controls input { min-width: 180px; padding: 8px 10px; font: inherit; font-weight: 400; border: 1px solid var(--me-line); border-radius: 6px; background: #fff; }
.me-controls input { min-width: 110px; width: 110px; }
.me select:focus-visible, .me input:focus-visible, .me button:focus-visible { outline: 2px solid var(--me-accent); outline-offset: 2px; }
.me-msg { padding: 10px 12px; border-radius: 6px; margin-bottom: 16px; font-size: .95rem; }
.me-err { background: #fdecea; color: var(--me-bad); }
.me-ok { background: #e7f4ec; color: var(--me-ok); }
.me-empty { color: var(--me-muted); }
.me-table-wrap { overflow-x: auto; border: 1px solid var(--me-line); border-radius: 8px; background: #fff; }
.me-table { width: 100%; border-collapse: collapse; }
.me-table th, .me-table td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--me-line); }
.me-table tbody tr:last-child td { border-bottom: 0; }
.me-table th { font-size: .85rem; color: var(--me-muted); font-weight: 600; background: #f6f8fa; }
.me-table .num { text-align: right; }
.me-table td input { width: 96px; padding: 6px 8px; text-align: right; font: inherit; border: 1px solid var(--me-line); border-radius: 6px; }
.me-table td input.bad { border-color: var(--me-bad); background: #fdecea; }
.me-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; color: var(--me-muted); }
.me-foot button { padding: 10px 22px; font: inherit; font-weight: 600; color: #fff; background: var(--me-accent); border: 0; border-radius: 6px; cursor: pointer; }
.me-foot button:disabled { background: #a9b4c2; cursor: not-allowed; }
`;