interface AuthFieldLabelProps {
  htmlFor: string;
  children: string;
}

export function AuthFieldLabel({ htmlFor, children }: AuthFieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-xs font-medium uppercase tracking-widest text-white/70"
    >
      {children}
    </label>
  );
}
