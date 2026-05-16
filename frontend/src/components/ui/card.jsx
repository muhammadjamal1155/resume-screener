import React from "react";

import { cn } from "../../lib/utils";

export function Card({ className, children }) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/10 bg-card/70 shadow-2xl shadow-black/20 backdrop-blur-xl",
        className,
      )}
    >
      {children}
    </section>
  );
}
