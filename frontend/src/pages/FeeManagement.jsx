import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/ui";
import { FeeStructurePanel } from "./FeeStructure";
import { FeeDuesPanel } from "./FeeDues";
import { FeesPanel } from "./Fees";

const TABS = [
  { key: "structure", label: "Fee structure" },
  { key: "dues", label: "Dues" },
  { key: "payments", label: "Payments" },
];
const DEFAULT_TAB = "dues";

const HINTS = {
  structure: "Set the monthly fee for each class. Challans use these amounts.",
  dues: "What each student still owes, and monthly challan generation.",
  payments: "Every challan: add, edit, mark paid or delete.",
};

export default function FeeManagement() {
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab");
  const tab = TABS.some((t) => t.key === requested) ? requested : DEFAULT_TAB;

  return (
    <AppShell title="Fee management" subtitle={HINTS[tab]}>
      <style>{css}</style>
      <div className="fm-tabs" role="tablist" aria-label="Fee sections">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            id={"fm-tab-" + t.key}
            aria-selected={tab === t.key}
            aria-controls="fm-panel"
            className="fm-tab"
            onClick={() => setParams({ tab: t.key })}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div id="fm-panel" role="tabpanel" aria-labelledby={"fm-tab-" + tab}>
        {tab === "structure" && <FeeStructurePanel />}
        {tab === "dues" && <FeeDuesPanel />}
        {tab === "payments" && <FeesPanel />}
      </div>
    </AppShell>
  );
}

const css = `
.fm-tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid #d9dfe6; }
.fm-tab { margin-bottom: -1px; padding: 10px 20px; font: inherit; font-weight: 600; color: #5d6b7a; background: none; border: 0; border-bottom: 3px solid transparent; cursor: pointer; }
.fm-tab:hover { color: #1c2530; }
.fm-tab[aria-selected="true"] { color: #1f4e8c; border-bottom-color: #1f4e8c; }
.fm-tab:focus-visible { outline: 2px solid #1f4e8c; outline-offset: 2px; }
`;