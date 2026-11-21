/* =====================================
   Dialog — plain-CSS port of shadcn/ui Dialog
   (overlay + centered panel + built-in close button, Escape &
   backdrop-click to close, body scroll lock)
===================================== */

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import "./Dialog.css";

function Dialog({ open, onOpenChange, children }) {
  const contentRef = React.useRef(null);

  /* Escape to close */
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onOpenChange?.(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  /* Body scroll lock while open */
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="ui-dialog-root">
      <div
        className="ui-dialog-overlay"
        onMouseDown={(e) => {
          /* Click on the backdrop (not the panel) closes, like Radix. */
          if (contentRef.current && !contentRef.current.contains(e.target)) {
            onOpenChange?.(false);
          }
        }}
      />
      {React.Children.map(children, (child) =>
        React.isValidElement(child) && child.type === DialogContent
          ? React.cloneElement(child, { __rootRef: contentRef, __close: () => onOpenChange?.(false) })
          : child
      )}
    </div>
  );
}

function DialogContent({ className, children, __rootRef, __close, ...props }) {
  return (
    <div className="ui-dialog-portal">
      <div ref={__rootRef} className={cn("ui-dialog-content", className)} {...props}>
        {children}
        <button
          className="ui-dialog-close"
          aria-label="Close"
          onClick={__close}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DialogHeader({ className, ...props }) {
  return <div className={cn("ui-dialog-header", className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
  return <div className={cn("ui-dialog-footer", className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
  return <h2 className={cn("ui-dialog-title", className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
  return <p className={cn("ui-dialog-description", className)} {...props} />;
}

export {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};
