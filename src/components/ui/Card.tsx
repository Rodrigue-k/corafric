import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  hoverable = false,
  className = "",
  children,
  ...props
}) => {
  return (
    <div
      className={`bg-card rounded-2xl border border-border/80 shadow-sm p-6 overflow-hidden transition-all duration-300 ${
        hoverable ? "hover:shadow-md hover:border-primary/20 hover:-translate-y-0.5" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
