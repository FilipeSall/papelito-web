interface AuthSocialDividerProps {
  label: string;
}

export function AuthSocialDivider({ label }: AuthSocialDividerProps) {
  return (
    <div className="mt-8 flex items-center gap-4">
      <div className="h-px flex-1 bg-white/10" />
      <span className="text-xs text-white/30">{label}</span>
      <div className="h-px flex-1 bg-white/10" />
    </div>
  );
}
