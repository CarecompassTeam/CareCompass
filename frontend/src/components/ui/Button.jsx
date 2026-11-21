/* =====================================
   Button — plain-CSS port of shadcn/ui Button
   (New York style, teal CareCompass theme)
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./Button.css";

export const buttonVariants = ({ variant = "default", size = "default", className } = {}) =>
  cn("ui-btn", `ui-btn-${variant}`, `ui-btn-size-${size}`, className);

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  return <button data-slot="button" className={buttonVariants({ variant, size, className })} {...props} />;
}

export default Button;
