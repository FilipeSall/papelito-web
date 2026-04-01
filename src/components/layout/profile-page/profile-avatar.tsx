/**
 * Avatar circular do perfil do usuário.
 * Exibe o ícone de usuário em um círculo amarelo.
 */
export function ProfileAvatar() {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-brand-yellow">
      <svg
        aria-hidden
        className="h-9 w-9 text-brand-dark"
        fill="none"
        viewBox="0 0 36 36"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M18 18C21.3137 18 24 15.3137 24 12C24 8.68629 21.3137 6 18 6C14.6863 6 12 8.68629 12 12C12 15.3137 14.6863 18 18 18Z"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
        <path
          d="M29.5 30C29.5 25.0294 24.3513 21 18 21C11.6487 21 6.5 25.0294 6.5 30"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
