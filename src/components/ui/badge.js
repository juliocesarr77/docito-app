import React from "react";
import clsx from "clsx";

const Badge = ({ children, className }) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full",
        "bg-pink-100 text-pink-800",
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;