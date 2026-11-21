/* =====================================
   Select — plain-CSS port of shadcn/ui Select
   Same composition API:

     <Select value={v} onValueChange={setV}>
       <SelectTrigger className="...">
         <SelectValue placeholder="Pick one" />
       </SelectTrigger>
       <SelectContent>
         <SelectItem value="a">Option A</SelectItem>
       </SelectContent>
     </Select>

   Items stay mounted so their labels register with the root and the
   trigger can always display the selected item's text (Radix behaviour).
===================================== */

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "../../utils/cn";
import "./Select.css";

const SelectCtx = React.createContext(null);

function flattenText(node) {
  if (node === null || node === undefined || node === false || node === true) return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(flattenText).join("");
  if (React.isValidElement(node)) return flattenText(node.props.children);
  return "";
}

function Select({ value, onValueChange, children }) {
  const [open, setOpen] = React.useState(false);
  /* value -> label, filled by SelectItem on mount. State (not a ref) so the
     trigger re-renders once labels are known. */
  const [labels, setLabels] = React.useState({});
  const rootRef = React.useRef(null);

  /* Close on outside click / Escape */
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const registerItem = React.useCallback((v, label) => {
    setLabels((prev) => (prev[v] === label ? prev : { ...prev, [v]: label }));
  }, []);

  const unregisterItem = React.useCallback((v) => {
    setLabels((prev) => {
      if (!(v in prev)) return prev;
      const next = { ...prev };
      delete next[v];
      return next;
    });
  }, []);

  const ctx = React.useMemo(
    () => ({ value, onValueChange, open, setOpen, labels, registerItem, unregisterItem }),
    [value, onValueChange, open, labels, registerItem, unregisterItem]
  );

  return (
    <SelectCtx.Provider value={ctx}>
      <div className="ui-select" ref={rootRef}>{children}</div>
    </SelectCtx.Provider>
  );
}

function SelectTrigger({ className, children, ...props }) {
  const ctx = React.useContext(SelectCtx);
  return (
    <button
      type="button"
      className={cn("ui-select-trigger", className)}
      onClick={() => ctx.setOpen((o) => !o)}
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      {...props}
    >
      {children}
      <ChevronDown className="ui-select-chevron h-4 w-4 opacity-50" />
    </button>
  );
}

function SelectValue({ placeholder, children }) {
  const ctx = React.useContext(SelectCtx);
  const hasValue = ctx.value !== undefined && ctx.value !== "";
  const label = hasValue ? ctx.labels[ctx.value] : undefined;

  if (label !== undefined && label !== "") {
    return <span className="ui-select-value">{label}</span>;
  }
  return (
    <span className="ui-select-value ui-select-placeholder">
      {placeholder || children || "Select…"}
    </span>
  );
}

function SelectContent({ className, children, ...props }) {
  const ctx = React.useContext(SelectCtx);
  /* Items stay mounted even when closed so their labels register for the
     trigger (Radix keeps the selected item's text available). Hidden via CSS. */
  return (
    <div
      className={cn(
        "ui-select-content",
        !ctx.open && "ui-select-content-hidden",
        className
      )}
      role="listbox"
      aria-hidden={!ctx.open}
      {...props}
    >
      {children}
    </div>
  );
}

function SelectItem({ value, className, children, ...props }) {
  const ctx = React.useContext(SelectCtx);
  const selected = ctx.value === value;
  const text = flattenText(children);

  /* Register the label so SelectValue can display it on the trigger. */
  React.useEffect(() => {
    ctx.registerItem(value, text);
    return () => ctx.unregisterItem(value);
  }, [ctx.registerItem, ctx.unregisterItem, value, text]);

  return (
    <div
      role="option"
      aria-selected={selected}
      className={cn("ui-select-item", className)}
      onClick={() => {
        ctx.onValueChange?.(value);
        ctx.setOpen(false);
      }}
      {...props}
    >
      <span className="ui-select-item-text">{children}</span>
      {selected && <Check className="ui-select-item-check h-4 w-4" />}
    </div>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
