/* =====================================
   DropdownMenu — plain-CSS port of shadcn/ui DropdownMenu
   Same composition API:

     <DropdownMenu>
       <DropdownMenuTrigger asChild><button/></DropdownMenuTrigger>
       <DropdownMenuContent align="end">
         <DropdownMenuLabel>…</DropdownMenuLabel>
         <DropdownMenuSeparator />
         <DropdownMenuItem onSelect={fn} disabled>…</DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>

   Outside click / Escape close it (Radix behaviour).
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./DropdownMenu.css";

const MenuCtx = React.createContext(null);

function DropdownMenu({ children }) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef(null);

  /* Close on outside click / Escape while open */
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

  const ctx = React.useMemo(
    () => ({ open, setOpen }),
    [open]
  );

  return (
    <MenuCtx.Provider value={ctx}>
      <div className="ui-dd" ref={rootRef}>
        {children}
      </div>
    </MenuCtx.Provider>
  );
}

function DropdownMenuTrigger({ asChild, children, ...props }) {
  const ctx = React.useContext(MenuCtx);

  if (asChild && React.isValidElement(children)) {
    /* Radix asChild: merge the toggle onto the caller's element. */
    return React.cloneElement(children, {
      onClick: (e) => {
        children.props.onClick?.(e);
        ctx.setOpen((o) => !o);
      },
      "aria-haspopup": "menu",
      "aria-expanded": ctx.open,
    });
  }

  return (
    <button
      type="button"
      onClick={() => ctx.setOpen((o) => !o)}
      aria-haspopup="menu"
      aria-expanded={ctx.open}
      {...props}
    >
      {children}
    </button>
  );
}

function DropdownMenuContent({ className, align = "start", sideOffset = 4, ...props }) {
  const ctx = React.useContext(MenuCtx);
  if (!ctx.open) return null;

  return (
    <div
      role="menu"
      data-align={align}
      className={cn("ui-dd-content", className)}
      style={{ top: sideOffset }}
      {...props}
    />
  );
}

function DropdownMenuItem({ className, onSelect, disabled, ...props }) {
  const ctx = React.useContext(MenuCtx);
  return (
    <div
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      className={cn("ui-dd-item", className)}
      data-disabled={disabled ? "" : undefined}
      onClick={() => {
        if (disabled) return;
        onSelect?.();
        ctx.setOpen(false);
      }}
      {...props}
    />
  );
}

function DropdownMenuLabel({ className, ...props }) {
  return <div className={cn("ui-dd-label", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }) {
  return <div className={cn("ui-dd-separator", className)} {...props} />;
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
};
