export type AboutStoryContent = {
  eyebrow: string;
  title: string;
  desktopParagraphs: string[];
  mobileParagraphs: string[];
};

export type AboutValue = {
  iconSrc: string;
  iconAlt: string;
  iconWidth: number;
  iconHeight: number;
  iconClassName?: string;
  title: string;
  description: string;
};

export const ABOUT_STORY_CONTENT: AboutStoryContent = {
  eyebrow: "Nossa história",
  title: "Mais de uma década de história",
  desktopParagraphs: [
    'A Papelito transcende a definição de uma simples marca; somos um movimento que redefine o padrão de qualidade e inovação no universo "roll your own" (RYO). Com uma visão audaciosa e um compromisso inabalável com a excelência, consolidamos nossa posição como referência no Brasil e avançamos com determinação para conquistar os mercados globais mais exigentes.',
    "Somos referência nacional: a primeira e única fábrica de papel de seda e papéis para fumo do Brasil. Nascemos pioneiros e crescemos com a convicção de que quem sabe faz o próprio caminho e o próprio papel.",
  ],
  mobileParagraphs: [
    'A Papelito transcende a definição de uma simples marca; somos um movimento que redefine o padrão de qualidade e inovação no universo "roll your own" (RYO). Com uma visão audaciosa e um compromisso inabalável com a excelência, consolidamos nossa posição como referência no Brasil e avançamos com determinação para conquistar os mercados globais mais exigentes.',
    "Investimos pesado em tecnologia, viajamos para conhecer as melhores fábricas da Europa e trouxemos o que aprendemos para o coração do Brasil. Cada detalhe — da espessura à textura, da queima ao sabor — foi pensado com obsessão por quem entende do que faz.",
  ],
};

export const ABOUT_VALUES: AboutValue[] = [
  {
    iconSrc: "/images/icons/sustentabilidade.svg",
    iconAlt: "Ícone de sustentabilidade",
    iconWidth: 29,
    iconHeight: 26,
    title: "Sustentabilidade",
    description:
      "Nossa visão de longo prazo reflete um desejo genuíno de contribuir com um setor mais responsável e alinhado às demandas do consumidor moderno, que busca marcas com valores e práticas éticas.",
  },
  {
    iconSrc: "/images/icons/coracao.svg",
    iconAlt: "Ícone de inovação em redução de danos",
    iconWidth: 33,
    iconHeight: 25,
    iconClassName: "max-w-[1.625rem]",
    title: "Inovação em Redução de Danos",
    description:
      "Somos pioneiros na redução de danos, dedicados a desenvolver produtos inovadores para uma experiência segura e de qualidade. Nosso foco é a saúde e o bem-estar dos clientes, oferecendo alternativas de menor risco através de pesquisa e tecnologia de ponta.",
  },
  {
    iconSrc: "/images/icons/reciclagem.svg",
    iconAlt: "Ícone de produtos sustentáveis",
    iconWidth: 27,
    iconHeight: 30,
    title: "Produtos Sustentáveis",
    description:
      "Nossos produtos são livres de solventes, pesticidas, PFAs e óleos minerais. Usamos matérias-primas puras e coloração natural. Livres de alérgenos, substâncias tóxicas, disruptores endócrinos e OGM. 100% vegano e cruelty-free.",
  },
];
