/* =====================================
   Separator — plain-CSS port of shadcn/ui Separator
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./Separator.css";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}) {
  return (
    <div
      data-slot="separator"
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={cn(
        "ui-separator",
        orientation === "vertical" ? "ui-separator-vertical" : "ui-separator-horizontal",
        className
      )}
      {...props}
    />
  );
}

export { Separator };
export default Separator;
