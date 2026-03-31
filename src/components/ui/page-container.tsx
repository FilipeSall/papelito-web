import { ComponentPropsWithoutRef } from "react";

type PageContainerProps = ComponentPropsWithoutRef<"div">;

export function PageContainer({ className = "", ...props }: PageContainerProps) {
  return <div className={`mx-auto w-full max-w-5xl ${className}`.trim()} {...props} />;
}
