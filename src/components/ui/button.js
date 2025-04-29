import React from "react";
import "./button.css"; // Importe o arquivo CSS

export function Button({
  children,
  onClick,
  className = "",
  type = "button",
  variant = "default", // "primary", "secondary", "outline", "default"
  size = "md", // "sm", "md", "lg"
  isLoading = false,
  disabled = false,
}) {
  const buttonVariants = {
    primary:
      "docito-button docito-button-primary bg-orange-600 hover:bg-orange-700 text-white",
    secondary:
      "docito-button docito-button-secondary bg-gray-600 hover:bg-gray-700 text-white",
    outline:
      "docito-button docito-button-outline bg-transparent border border-orange-600 text-orange-600 hover:bg-orange-50",
    default: // Adicione a variante "default"
      "docito-button docito-button-default bg-blue-500 hover:bg-blue-700 text-white", // Estilos para a variante "default"
  };

  const buttonSizes = {
    sm: "docito-button docito-button-sm py-1 px-2 text-sm",
    md: "docito-button docito-button-md py-2 px-4 text-base",
    lg: "docito-button docito-button-lg py-3 px-6 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      className={`docito-button font-medium rounded-lg shadow transition disabled:opacity-50 disabled:cursor-not-allowed
                  ${buttonVariants[variant] || buttonVariants["default"]} // Use a variante "default" como padrão
                  ${buttonSizes[size] || buttonSizes["md"]}
                  ${className}`}
      disabled={isLoading || disabled}
    >
      {isLoading ? "Carregando..." : children}
    </button>
  );
}
