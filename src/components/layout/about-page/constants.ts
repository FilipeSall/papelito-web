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
  eyebrow: "Nossa historia",
  title: "Mais de uma decada de historia",
  desktopParagraphs: [
    'A Papelito transcende a definicao de uma simples marca; somos um movimento que redefine o padrao de qualidade e inovacao no universo "roll your own" (RYO). Com uma visao audaciosa e um compromisso inabalavel com a excelencia, consolidamos nossa posicao como referencia no Brasil e avancamos com determinacao para conquistar os mercados globais mais exigentes.',
    "Somos referencia nacional: a primeira e unica fabrica de papel de seda e papeis para fumo do Brasil. Nascemos pioneiros e crescemos com a conviccao de que quem sabe faz o proprio caminho e o proprio papel.",
  ],
  mobileParagraphs: [
    'A Papelito transcende a definicao de uma simples marca; somos um movimento que redefine o padrao de qualidade e inovacao no universo "roll your own" (RYO). Com uma visao audaciosa e um compromisso inabalavel com a excelencia, consolidamos nossa posicao como referencia no Brasil e avancamos com determinacao para conquistar os mercados globais mais exigentes.',
    "Investimos pesado em tecnologia, viajamos para conhecer as melhores fabricas da Europa e trouxemos o que aprendemos para o coracao do Brasil. Cada detalhe — da espessura a textura, da queima ao sabor — foi pensado com obsessao por quem entende do que faz.",
  ],
};

export const ABOUT_VALUES: AboutValue[] = [
  {
    iconSrc: "/images/icons/sustentabilidade.svg",
    iconAlt: "Icone de sustentabilidade",
    iconWidth: 29,
    iconHeight: 26,
    title: "Sustentabilidade",
    description:
      "Nossa visao de longo prazo reflete um desejo genuino de contribuir com um setor mais responsavel e alinhado as demandas do consumidor moderno, que busca marcas com valores e praticas eticas.",
  },
  {
    iconSrc: "/images/icons/coracao.svg",
    iconAlt: "Icone de inovacao em reducao de danos",
    iconWidth: 33,
    iconHeight: 25,
    iconClassName: "max-w-[1.625rem]",
    title: "Inovacao em Reducao de Danos",
    description:
      "Somos pioneiros na reducao de danos, dedicados a desenvolver produtos inovadores para uma experiencia segura e de qualidade. Nosso foco e a saude e o bem-estar dos clientes, oferecendo alternativas de menor risco atraves de pesquisa e tecnologia de ponta.",
  },
  {
    iconSrc: "/images/icons/reciclagem.svg",
    iconAlt: "Icone de produtos sustentaveis",
    iconWidth: 27,
    iconHeight: 30,
    title: "Produtos Sustentaveis",
    description:
      "Nossos produtos sao livres de solventes, pesticidas, PFAs e oleos minerais. Usamos materias-primas puras e coloracao natural. Livres de alergenos, substancias toxicas, disruptores endocrinos e OGM. 100% vegano e cruelty-free.",
  },
];
