import Link from "next/link";

import { SOCIAL_ICONS } from "@/components/ui/icons/social-icons";
import {
  type SocialProfileLink,
  resolveSocialProfiles,
} from "@/features/site-contact/social-profiles";

type FooterSocialLinksProps = {
  profiles?: readonly SocialProfileLink[];
};

/**
 * Links de redes sociais do footer.
 *
 * Os perfis sao configurados pelo admin em `/admin/config#atendimento` e chegam resolvidos por
 * `resolveSocialProfiles`; sem configuracao, valem os padroes do catalogo. A mesma lista alimenta o
 * `sameAs` do dado estruturado da organizacao — perfil declarado ao Google e perfil exibido ao
 * usuario nao podem divergir.
 */
export function FooterSocialLinks({ profiles }: FooterSocialLinksProps) {
  const resolved = profiles ?? resolveSocialProfiles();

  return (
    <div className="flex gap-4">
      {resolved.map((social) => {
        const Icon = SOCIAL_ICONS[social.id];

        return Icon ? (
          <Link
            key={social.id}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={social.name}
            className="text-white/60 hover:text-white transition-colors"
          >
            <Icon className="size-4.5" />
          </Link>
        ) : null;
      })}
    </div>
  );
}
