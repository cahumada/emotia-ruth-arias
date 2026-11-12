import type { AnchorHTMLAttributes, ReactNode } from "react";

type HomeButtonProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  appearance?: "solid" | "outline" | "light";
  isSmall?: boolean;
  opensInNewTab?: boolean;
  children: ReactNode;
};

export function HomeButton({
  appearance = "solid",
  isSmall = false,
  opensInNewTab = false,
  className,
  children,
  ...props
}: HomeButtonProps) {
  const classes = [
    "btn",
    appearance === "outline" ? "btn-outline" : "",
    appearance === "light" ? "btn-light" : "",
    isSmall ? "btn-small" : "",
    className ?? "",
  ]
    .filter((classNamePart) => classNamePart.length > 0)
    .join(" ");

  return (
    <a
      {...props}
      className={classes}
      {...(opensInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
    </a>
  );
}
