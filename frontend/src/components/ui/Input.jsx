/* =====================================
   Input — plain-CSS port of shadcn/ui Input
   (New York style, CareCompass theme)
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./Input.css";

function Input({ className, type = "text", ...props }) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn("ui-input", className)}
      {...props}
    />
  );
}

export { Input };
export default Input;
