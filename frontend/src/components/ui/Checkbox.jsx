/* =====================================
   Checkbox — plain-CSS port of shadcn/ui Checkbox
   Same API surface:

     <Checkbox checked={v} onCheckedChange={(next) => ...} />

   Radix behaviour: space/enter toggles, indeterminate state supported.
===================================== */

import * as React from "react";
import { CheckIcon, MinusIcon } from "lucide-react";
import { cn } from "../../utils/cn";
import "./Checkbox.css";

function Checkbox({ className, checked, onCheckedChange, ...props }) {
  const isOn = checked === true;
  const isIndeterminate = checked === "indeterminate";

  const toggle = () => {
    if (onCheckedChange) onCheckedChange(!isOn);
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isIndeterminate ? "mixed" : isOn}
      data-state={isIndeterminate ? "indeterminate" : isOn ? "checked" : "unchecked"}
      className={cn("ui-checkbox", className)}
      onClick={toggle}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          toggle();
        }
      }}
      {...props}
    >
      <span className="ui-checkbox-box">
        {isIndeterminate ? (
          <MinusIcon className="ui-checkbox-glyph" />
        ) : isOn ? (
          <CheckIcon className="ui-checkbox-glyph" />
        ) : null}
      </span>
    </button>
  );
}

export { Checkbox };
export default Checkbox;
