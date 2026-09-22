import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import {
  AddButton,
  AppShell,
  Button,
  DeleteButton,
  EditButton,
  FormItem,
  INPUT_CLS,
  Modal,
  Notice,
} from "../components/ui";

const EMPTY = {
  roll_no: "",
  full_name: "",
  class_name: "",
  section: "",
  school_class: "",
  date_of_birth: "",
  cnic_or_bform: "",
};

const TONES = [
  "bg-amber-50 text-amber-800 border-amber-200",
  "bg-orange-50 text-orange-800 border-orange-200",
  "bg-violet-50 text-violet-800 border-violet-200",
  "bg-sky-50 text-sky-800 border-sky-200",
  "bg-emerald-50 text-emerald-800 border-emerald-200",
];
const toneFor = (text) => {
  let n = 0;
  for (const ch of String(text || "?")) n += ch.charCodeAt(0);
  return TONES[n % TONES.length];
};

const asList = (d) => (Array.isArray(d) ? d : d?.results ?? []);
const nullable = (v) => (v === "" ? null : v);
const idString = (v) => (v === null || v === undefined ? "" : String(v));
const classLabel = (s) => (s.class_name || "-") + (s.section ? " " + s.section : "");

const fromEntry = (s) => ({
  roll_no: s.roll_no ?? "",
  full_name: s.full_name ?? "",
  class_name: s.class_name ?? "",
  section: s.section ?? "",
  school_class: idString(s.school_class),
  date_of_birth: s.date_of_birth ?? "",
  cnic_or_bform: s.cnic_or_bform ?? "",
});

function prettyDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full border px-4 py-2 text-sm font-bold transition-colors " +
        (active
          ? "border-keen-charcoal bg-keen-charcoal text-white"
          : "border-keen-border bg-white text-keen-charcoal hover:bg-slate-50")
      }
    >
      {children}
    </button>
  );
}

function Avatar({ text }) {
  return (
    <div
      className={
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-sm font-bold " + toneFor(text)
      }
    >
      {(text || "?")[0].toUpperCase()}
    </div>
  );
}

export default function Students() {
  const [roster, setRoster] = useState([]);
  const [pending, setPending] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("roster");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [initial, setInitial] = useState(EMPTY);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [actingId, setActingId] = useState(null);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    setPageError("");
    try {
      const [rosterData, pendingData, classData] = await Promise.all([
        api.listStudentManage(),
        api.pendingStudents(),
        api.listSchoolClasses(),
      ]);
      setRoster(asList(rosterData));
      setPending(asList(pendingData));
      setClasses(asList(classData));
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const isEdit = editing !== null;
  const ready = form.roll_no.trim() !== "" && form.full_name.trim() !== "" && form.class_name.trim() !== "";
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);

  function pickClass(e) {
    const value = e.target.value;
    const c = classes.find((x) => String(x.id) === value);
    setForm((f) => ({
      ...f,
      school_class: value,
      class_name: c ? c.name : f.class_name,
      section: c ? c.section || "" : f.section,
    }));
  }

  function openAdd() {
    setForm(EMPTY);
    setInitial(EMPTY);
    setEditing(null);
    setFormError("");
    setOpen(true);
  }

  function openEdit(s) {
    const start = fromEntry(s);
    setForm(start);
    setInitial(start);
    setEditing(s);
    setFormError("");
    setOpen(true);
  }

  function closeNow() {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
    setInitial(EMPTY);
    setFormError("");
  }

  function close() {
    if (dirty && !window.confirm("Discard your changes? What you typed will be lost.")) return;
    closeNow();
  }

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setFormError("");
    setNotice("");
    const payload = {
      roll_no: form.roll_no.trim(),
      full_name: form.full_name.trim(),
      class_name: form.class_name.trim(),
      section: form.section.trim(),
      school_class: form.school_class === "" ? null : Number(form.school_class),
      date_of_birth: nullable(form.date_of_birth),
      cnic_or_bform: form.cnic_or_bform.trim(),
    };
    try {
      if (isEdit) {
        const updated = await api.updateStudentRoster(editing.id, payload);
        setRoster((list) => list.map((i) => (i.id === editing.id ? updated : i)));
        setNotice("Saved changes for " + updated.full_name + ".");
      } else {
        await api.enrollStudent(payload);
        await load(true);
        setNotice(payload.full_name + " was added to the roster.");
      }
      closeNow();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(s) {
    if (!window.confirm("Delete " + s.full_name + " (" + s.roll_no + ")? This can't be undone.")) return;
    setPageError("");
    setNotice("");
    setDeletingId(s.id);
    try {
      await api.deleteStudentRoster(s.id);
      setRoster((list) => list.filter((i) => i.id !== s.id));
      setNotice(s.full_name + " was deleted.");
    } catch (err) {
      setPageError(err.message);
    } finally {
      setDeletingId(null);
    }
  }

  async function approve(u) {
    const name = u.first_name || u.username;
    setPageError("");
    setNotice("");
    setActingId(u.id);
    try {
      await api.approveStudent(u.id);
      await load(true);
      setNotice(name + " was approved and can now sign in.");
    } catch (err) {
      setPageError(err.message);
    } finally {
      setActingId(null);
    }
  }

  async function reject(u) {
    const name = u.first_name || u.username;
    if (!window.confirm("Reject the signup from " + name + "?")) return;
    setPageError("");
    setNotice("");
    setActingId(u.id);
    try {
      await api.rejectStudent(u.id);
      await load(true);
      setNotice("Signup from " + name + " was rejected.");
    } catch (err) {
      setPageError(err.message);
    } finally {
      setActingId(null);
    }
  }

  const count = roster.length;
  const subtitle =
    count + " student" + (count === 1 ? "" : "s") + " on the roll" +
    (pending.length ? " - " + pending.length + " awaiting approval" : "");

  return (
    <AppShell
      badge="Enrolment"
      title="Students Management"
      subtitle={subtitle}
      action={<AddButton onClick={openAdd}>+ Add New Student</AddButton>}
    >
      <div className="flex gap-2">
        <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
          Roster ({count})
        </TabButton>
        <TabButton active={tab === "pending"} onClick={() => setTab("pending")}>
          Pending approvals ({pending.length})
        </TabButton>
      </div>

      <div className="space-y-3">
        <Notice>{pageError}</Notice>
        <Notice tone="success">{notice}</Notice>
      </div>

      {tab === "roster" ? (
        <div className="overflow-hidden rounded-2xl border border-keen-border bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm font-medium text-keen-muted">Loading...</p>
          ) : count === 0 ? (
            <div className="p-10 text-center">
              <p className="text-base font-bold text-keen-charcoal">No students yet</p>
              <p className="mt-1 text-sm text-keen-muted">Click "Add New Student" to add the first one.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-keen-charcoal text-xs font-extrabold uppercase tracking-wider text-white">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">CNIC / B-form</th>
                    <th className="px-5 py-4">Account</th>
                    <th className="px-5 py-4">Source</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roster.map((s) => (
                    <tr key={s.id} className="border-t border-keen-border">
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-keen-muted">#{s.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar text={s.full_name} />
                          <div>
                            <div className="text-base font-bold text-keen-charcoal">{s.full_name}</div>
                            <div className="whitespace-nowrap font-mono text-sm text-keen-muted">{s.roll_no}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={"whitespace-nowrap rounded-full border px-3 py-1 text-sm font-bold " + toneFor(classLabel(s))}>
                          {classLabel(s)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-keen-charcoal">{s.cnic_or_bform || "-"}</td>
                      <td className="px-5 py-4">
                        {s.is_claimed ? (
                          <span className="whitespace-nowrap rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                            Active
                          </span>
                        ) : (
                          <span className="whitespace-nowrap rounded-full border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
                            Not signed up
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-sm text-keen-charcoal">
                        <span className="whitespace-nowrap">{s.source === "self" ? "Self signup" : "Admin"}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <EditButton onClick={() => openEdit(s)} />
                          <DeleteButton onClick={() => remove(s)} busy={deletingId === s.id} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-keen-border bg-white shadow-sm">
          {loading ? (
            <p className="p-8 text-center text-sm font-medium text-keen-muted">Loading...</p>
          ) : pending.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-base font-bold text-keen-charcoal">No pending signups</p>
              <p className="mt-1 text-sm text-keen-muted">New student signups that need approval will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-keen-charcoal text-xs font-extrabold uppercase tracking-wider text-white">
                    <th className="px-5 py-4">ID</th>
                    <th className="px-5 py-4">Student</th>
                    <th className="px-5 py-4">Roll No</th>
                    <th className="px-5 py-4">Class</th>
                    <th className="px-5 py-4">Requested</th>
                    <th className="px-5 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pending.map((u) => (
                    <tr key={u.id} className="border-t border-keen-border">
                      <td className="px-5 py-4">
                        <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold text-keen-muted">#{u.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar text={u.first_name || u.username} />
                          <div>
                            <div className="text-base font-bold text-keen-charcoal">{u.first_name || u.username}</div>
                            <div className="text-sm text-keen-muted">{u.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-mono text-sm text-keen-charcoal">{u.roll_no || "-"}</td>
                      <td className="px-5 py-4">
                        <span className={"whitespace-nowrap rounded-full border px-3 py-1 text-sm font-bold " + toneFor(classLabel(u))}>
                          {classLabel(u)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-sm text-keen-charcoal">{prettyDate(u.date_joined)}</td>
                      <td className="px-5 py-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={actingId === u.id}
                            onClick={() => approve(u)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            &#10003; Approve
                          </button>
                          <button
                            type="button"
                            disabled={actingId === u.id}
                            onClick={() => reject(u)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3.5 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"
                          >
                            &#10005; Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={open}
        wide
        title={isEdit ? "Edit Student" : "Add New Student"}
        subtitle={isEdit ? "Update the student's details below" : "Fill in the student's details below"}
        onClose={close}
        footer={
          <>
            <Button variant="quiet" onClick={close} className="px-4 py-2.5 text-sm">
              Cancel
            </Button>
            <Button onClick={submit} disabled={!ready || busy} className="px-4 py-2.5 text-sm">
              {busy ? "Saving..." : isEdit ? "Save Changes" : "Add Student"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <FormItem
              label="Roll No"
              required
              hint={isEdit && editing.is_claimed ? "Locked because the student already has an account." : ""}
            >
              <input
                className={INPUT_CLS}
                placeholder="KEEN-104"
                value={form.roll_no}
                onChange={update("roll_no")}
                disabled={isEdit && editing.is_claimed}
              />
            </FormItem>
            <FormItem label="Full name" required>
              <input className={INPUT_CLS} placeholder="Full name" value={form.full_name} onChange={update("full_name")} />
            </FormItem>

            <FormItem label="Class" hint="Pick a class to fill in the name and section below.">
              <select className={INPUT_CLS} value={form.school_class} onChange={pickClass}>
                <option value="">Not linked</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name + (c.section ? " " + c.section : "")}
                  </option>
                ))}
              </select>
            </FormItem>
            <FormItem label="Class name" required>
              <input className={INPUT_CLS + (form.school_class ? " bg-slate-100 text-slate-500 cursor-not-allowed" : "")} placeholder="e.g. 9th" value={form.class_name} onChange={update("class_name")} disabled={!!form.school_class} />
            </FormItem>

            <FormItem label="Section">
              <input className={INPUT_CLS} placeholder="e.g. A" value={form.section} onChange={update("section")} />
            </FormItem>
            <FormItem label="Date of birth">
              <input type="date" className={INPUT_CLS} value={form.date_of_birth} onChange={update("date_of_birth")} />
            </FormItem>

            <FormItem label="CNIC / B-form" wide>
              <input
                className={INPUT_CLS}
                placeholder="XXXXX-XXXXXXX-X"
                value={form.cnic_or_bform}
                onChange={update("cnic_or_bform")}
              />
            </FormItem>
          </div>
          <Notice>{formError}</Notice>
        </div>
      </Modal>
    </AppShell>
  );
}