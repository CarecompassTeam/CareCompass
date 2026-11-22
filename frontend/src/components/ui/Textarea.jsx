/* =====================================
   Textarea — plain-CSS port of shadcn/ui Textarea
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./Textarea.css";

function Textarea({ className, ...props }) {
  return (
    <textarea
      data-slot="textarea"
      className={cn("ui-textarea", className)}
      {...props}
    />
  );
}

export { Textarea };
export default Textarea;
