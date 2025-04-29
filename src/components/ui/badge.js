import React from "react";
import clsx from "clsx";

const Badge = ({
  children,
  className,
  backgroundColor = "bg-pink-100",
  textColor = "text-pink-800",
  size = "md", // "sm", "md", "lg"
}) => {
  const sizeClasses = {
    sm: "px-1 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-semibold rounded-full",
        backgroundColor,
        textColor,
        sizeClasses[size] || sizeClasses["md"], // Use tamanho padrão se inválido
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
