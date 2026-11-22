/* =====================================
   Table — plain-CSS port of shadcn/ui Table
   Same composition API:

     <Table>
       <TableHeader><TableRow><TableHead>…</TableHead></TableRow></TableHeader>
       <TableBody><TableRow><TableCell>…</TableCell></TableRow></TableBody>
     </Table>

   A wrapper div provides the overflow container (shadcn
   data-slot="table-container"), so className on <Table> still
   controls the outer block.
===================================== */

import * as React from "react";
import { cn } from "../../utils/cn";
import "./Table.css";

function Table({ className, ...props }) {
  return (
    <div data-slot="table-container" className="ui-table-container">
      <table
        data-slot="table"
        className={cn("ui-table", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }) {
  return (
    <thead
      data-slot="table-header"
      className={cn("ui-table-header", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("ui-table-body", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("ui-table-footer", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }) {
  return (
    <tr
      data-slot="table-row"
      className={cn("ui-table-row", className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }) {
  return (
    <th
      data-slot="table-head"
      className={cn("ui-table-head", className)}
      {...props}
    />
  );
}

function TableCell({ className, ...props }) {
  return (
    <td
      data-slot="table-cell"
      className={cn("ui-table-cell", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
};
