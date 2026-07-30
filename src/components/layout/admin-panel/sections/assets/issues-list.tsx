export function IssuesList({ issues }: { issues: string[] }) {
  return (
    <div className="mb-4 rounded-[18px] border border-[#cfbf80] bg-[#fff6bf] px-4 py-4 text-sm leading-6 text-[#231f20]">
      {issues.join(" ")}
    </div>
  );
}
