import { EmptyStateCard } from "@/components/layout/operational-panel";

export function VendorEmptyState({
  body,
  label,
  title,
}: {
  body: string;
  label: string;
  title: string;
}) {
  return <EmptyStateCard body={body} label={label} title={title} />;
}
