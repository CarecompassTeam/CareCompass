/* =====================================
   Label — plain-CSS port of shadcn/ui Label
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./Label.css";

function Label({ className, ...props }) {
  return (
    <label
      data-slot="label"
      className={cn("ui-label", className)}
      {...props}
    />
  );
}

export { Label };
export default Label;
