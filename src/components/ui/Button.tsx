import React from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-primary text-white hover:bg-primary-hover focus:ring-primary",
    secondary:
      "bg-primary-tint text-primary border border-primary/20 hover:bg-primary/10 focus:ring-primary",
    ghost:
      "text-foreground hover:bg-black/5 hover:text-foreground focus:ring-foreground",
    destructive:
      "bg-red-600 text-white hover:bg-red-700 focus:ring-red-600",
    outline:
      "bg-transparent text-foreground border border-border hover:bg-black/5 hover:border-foreground/30 focus:ring-foreground",
  };


  const sizes: Record<ButtonSize, string> = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base",
  };

  const currentVariant = variants[variant];
  const currentSize = sizes[size];

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${currentVariant} ${currentSize} ${className}`}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {loading ? "Chargement..." : children}
    </button>
  );
};
