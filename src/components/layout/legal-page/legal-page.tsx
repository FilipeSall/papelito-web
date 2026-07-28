import type { ReactNode } from "react";
import Link from "next/link";

function LegalBadgeIcon() {
  return (
    <svg
      aria-hidden
      className="h-3.5 w-3.5"
      fill="none"
      viewBox="0 0 16 16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 2.5H9.5L12 5V12.25C12 12.9404 11.4404 13.5 10.75 13.5H5.25C4.55964 13.5 4 12.9404 4 12.25V3.75C4 3.05964 4.55964 2.5 5.25 2.5H5Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M9.5 2.75V5H11.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
      <path
        d="M6 8H10"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
      <path
        d="M6 10.5H8.75"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function LegalTitle({ children }: { children: string }) {
  return (
    <p className="text-[14px] leading-[22.75px] tracking-[-0.15px] text-slate-600">
      <strong className="font-semibold text-slate-700">{children}</strong>
    </p>
  );
}

function LegalParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[14px] leading-[22.75px] tracking-[-0.15px] text-slate-600">
      {children}
    </p>
  );
}

function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-disc space-y-0 pl-[21px] text-[14px] leading-[22.75px] tracking-[-0.15px] text-slate-600 marker:text-slate-500">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalPage() {
  return (
    <main className="bg-[#f9fafb]">
      <section className="bg-brand-dark px-6 pb-14 pt-10 md:pb-14 md:pt-14">
        <div className="mx-auto flex max-w-[896px] flex-col items-center text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-yellow px-4 py-1.5 text-[12px] font-black uppercase tracking-[0.6px] text-brand-dark">
            <LegalBadgeIcon />
            Legal
          </span>
          <h1 className="mt-4 text-[32px] font-black uppercase tracking-[0.37px] text-white md:text-[36px]">
            Termos & Privacidade
          </h1>
          <p className="mt-2 text-[14px] leading-5 tracking-[-0.15px] text-white/50">
            Última atualização: 01 de Janeiro de 2026 · Versão 3.0
          </p>
        </div>
      </section>

      <section className="px-6 py-14 md:py-[88px]">
        <div className="mx-auto flex max-w-[896px] flex-col items-center">
          <div className="w-full rounded-2xl bg-brand-yellow px-5 py-5 md:max-w-[832px]">
            <p className="text-[14px] font-black leading-5 tracking-[-0.15px] text-brand-dark">
              📋 Resumo dos Termos
            </p>
            <p className="mt-1 text-[14px] leading-5 tracking-[-0.15px] text-brand-dark/70">
              Ao usar nossa plataforma, você concorda com os termos descritos abaixo.
              Use com responsabilidade — nossos produtos são exclusivos para maiores de
              18 anos.
            </p>
          </div>

          <div className="mt-6 w-full border-t border-[#f3f4f6] px-6 pt-4 md:max-w-[832px] md:px-6">
            <div className="mx-auto flex max-w-[759px] flex-col space-y-0">
              <LegalParagraph>
                PAPELITO, pessoa jurídica de direito privado leva a sua privacidade a
                sério e zela pela segurança e proteção de dados de todos os seus
                clientes, parceiros, fornecedores e usuários do site domínio{" "}
                <a
                  className="underline decoration-slate-500 underline-offset-2"
                  href="https://papelitobrasil.com.br/Marketplace"
                  rel="noreferrer"
                  target="_blank"
                >
                  https://papelitobrasil.com.br/Marketplace
                </a>{" "}
                e qualquer outro site, loja ou aplicativo operado pela empresa.
              </LegalParagraph>
              <LegalParagraph>
                Esta Política de Privacidade destina-se a informá-lo sobre o modo como
                nós utilizamos e divulgamos informações coletadas em suas visitas à
                nossa loja e em mensagens que trocamos com você.
              </LegalParagraph>
              <LegalParagraph>
                Esta Política de Privacidade aplica-se somente a informações coletadas
                por meio da loja.
              </LegalParagraph>
              <LegalParagraph>
                Ao acessar a loja, enviar comunicações ou fornecer qualquer tipo de
                dado pessoal, você declara estar ciente com relação aos termos aqui
                previstos e de acordo com a política de privacidade, a qual descreve as
                finalidades e formas de tratamento de seus dados pessoais que você
                disponibiliza na loja.
              </LegalParagraph>
              <LegalParagraph>
                Esta Política de Privacidade fornece uma visão geral de nossas práticas
                de privacidade e das escolhas que você pode fazer, bem como direitos
                que você pode exercer em relação aos Dados Pessoais tratados por nós.
                Se você tiver alguma dúvida sobre o uso de Dados Pessoais, entre em
                contato com{" "}
                <a
                  className="underline decoration-slate-500 underline-offset-2"
                  href="mailto:loja@papelitobrasil.com"
                >
                  loja@papelitobrasil.com
                </a>
                .
              </LegalParagraph>
              <LegalParagraph>
                Caso você nos envie Dados Pessoais referentes a outras pessoas físicas,
                você declara ter a competência para fazê-lo e declara ter obtido o
                consentimento necessário para autorizar o uso de tais informações nos
                termos desta Política de Privacidade.
              </LegalParagraph>

              <LegalTitle>Definições</LegalTitle>
              <LegalParagraph>Para os fins desta Política de Privacidade:</LegalParagraph>
              <LegalList
                items={[
                  "“Dados Pessoais”: significa qualquer informação que, direta ou indiretamente, identifique ou possa identificar uma pessoa natural, como por exemplo, nome, CPF, data de nascimento, endereço IP, dentre outros;",
                  "“Dados Pessoais Sensíveis”: significa qualquer informação que revele, em relação a uma pessoa natural, origem racial ou étnica, convicção religiosa, opinião política, filiação a sindicato ou a organização de caráter religioso, filosófico ou político, dado referente à saúde ou à vida sexual, dado genético ou biométrico;",
                  "“Tratamento de Dados Pessoais”: significa qualquer operação efetuada no âmbito dos Dados Pessoais, por meio de meios automáticos ou não, tal como a recolha, gravação, organização, estruturação, armazenamento, adaptação ou alteração, recuperação, consulta, utilização, divulgação por transmissão, disseminação ou, alternativamente, disponibilização, harmonização ou associação, restrição, eliminação ou destruição. Também é considerado Tratamento de Dados Pessoais qualquer outra operação prevista nos termos da legislação aplicável;",
                  "“Leis de Proteção de Dados”: significa todas as disposições legais que regulam o Tratamento de Dados Pessoais, incluindo, porém sem se limitar, a Lei nº 13.709/18, Lei Geral de Proteção de Dados Pessoais (“LGPD”).",
                ]}
              />

              <LegalTitle>Uso de Dados Pessoais</LegalTitle>
              <LegalParagraph>
                Coletamos e usamos Dados Pessoais para gerenciar seu relacionamento
                conosco e melhor atendê-lo quando você estiver adquirindo produtos e/ou
                serviços na loja, personalizando e melhorando sua experiência. Exemplos
                de como usamos os dados incluem:
              </LegalParagraph>
              <LegalList
                items={[
                  "Viabilizar que você adquira produtos e/ou serviços na loja com informações de entrega bem como os dados necessários para a emissão da NF para que seja viabilizado a entrega e registro da compra;",
                  "Para confirmar ou corrigir as informações que temos sobre você;",
                  "Para enviar informações que acreditamos ser do seu interesse;",
                  "Para personalizar sua experiência de uso da loja;",
                  "Para entrarmos em contato por um número de telefone e/ou endereço de e-mail fornecido. Podemos entrar em contato com você pessoalmente, por mensagem de voz, através de equipamentos de discagem automática, por mensagens de texto (SMS), por e-mail, ou por qualquer outro meio de comunicação que seu dispositivo seja capaz de receber, nos termos da lei e para fins comerciais razoáveis.",
                ]}
              />

              <LegalParagraph>
                Outros propósitos para os quais processamos seus dados:
              </LegalParagraph>
              <LegalList
                items={[
                  "Oferecer produtos, serviços e/ou benefícios oferecidos pelas plataformas do Marketplace;",
                  "Aprimorar nossos serviços, desenvolver novos serviços e oferecer uma melhor experiência no ecossistema Papelito;",
                  "Divulgar anúncios e contatos promocionais e de publicidade adaptados aos seus interesses.",
                  "Colaborar com os titulares de direitos de propriedade intelectual.",
                ]}
              />

              <LegalParagraph>
                Além disso, os Dados Pessoais fornecidos também podem ser utilizados na
                forma que julgarmos necessária ou adequada: (a) nos termos das Leis de
                Proteção de Dados; (b) para atender exigências de processo judicial; (c)
                para cumprir decisão judicial, decisão regulatória ou decisão de
                autoridades competentes, incluindo autoridades fora do país de
                residência; (d) para aplicar nossos Termos e Condições de Uso; (e) para
                proteger nossas operações; (f) para proteger direitos, privacidade,
                segurança nossos, seus ou de terceiros; (g) para detectar e prevenir
                fraude; (h) permitir-nos usar as ações disponíveis ou limitar danos que
                venhamos a sofrer; e (i) de outros modos permitidos por lei.
              </LegalParagraph>

              <LegalTitle>Não fornecimento de Dados Pessoais</LegalTitle>
              <LegalParagraph>
                Não há obrigatoriedade em compartilhar os Dados Pessoais que
                solicitamos. No entanto, se você optar por não os compartilhar, em
                alguns casos, não poderemos fornecer a você acesso completo à loja,
                alguns recursos especializados ou ser capaz de prestar a assistência
                necessária ou, ainda, viabilizar a entrega do produto ou prestar o
                serviço contratado por você.
              </LegalParagraph>
              <LegalParagraph>
                Se as informações fornecidas não forem precisas, não podemos oferecer
                uma boa experiência. Se você fornecer informações incorretas ou falsas,
                os serviços que prestamos podem ser suspensos ou sua conta pode ser
                desativada.
              </LegalParagraph>
              <LegalParagraph>
                Se você é menor de idade, não deve fornecer suas informações pessoais,
                pois não possui capacidade legal para contratar nossos serviços.
              </LegalParagraph>

              <LegalTitle>Dados coletados</LegalTitle>
              <LegalParagraph>
                O público em geral poderá navegar na loja sem necessidade de qualquer
                cadastro e envio de Dados Pessoais. No entanto, algumas das
                funcionalidades da loja poderão depender de cadastro e envio de Dados
                Pessoais como concluir a compra/contratação do serviço e/ou a viabilizar
                a entrega do produto/prestação do serviço por nós.
              </LegalParagraph>
              <LegalParagraph>No contato a loja, nós podemos coletar:</LegalParagraph>
              <LegalList
                items={[
                  "Dados de contato: nome, sobrenome, número de telefone, endereço, cidade, estado e endereço de e-mail;",
                  "Informações enviadas: informações que você envia via formulário (dúvidas, reclamações, sugestões, críticas, elogios etc.).",
                  "Quando você se cadastra ou fornece informações usando a plataforma.",
                  "Automaticamente, como quando você navega nas nossas páginas.",
                  "De fontes confiáveis (prestadores de serviços ou parceiros de negócios com quem trabalhamos, agências de crédito, órgãos públicos).",
                ]}
              />
              <LegalParagraph>Tipos de dados que coletamos:</LegalParagraph>
              <LegalList
                items={[
                  "Apelido ou pseudônimo.",
                  "Nome e foto.",
                  "Identificação.",
                  "Informações de contato (número de telefone, endereço, e-mail etc.).",
                  "Dados patrimoniais e financeiros.",
                  "Meios de pagamento.",
                  "Direitos de propriedade intelectual.",
                  "Informações do dispositivo através do qual você acessa e endereço IP.",
                  "Links entre contas e usuários.",
                  "Informações e movimentações transacionais dentro das nossas plataformas.",
                  "Informações sobre sua localização.",
                  "Certas informações sobre a atividade e as preferências dos usuários e visitantes no nosso site e os aplicativos dos nossos serviços.",
                ]}
              />
              <LegalParagraph>
                Na navegação geral na loja, nós poderemos coletar:
              </LegalParagraph>
              <LegalList
                items={[
                  "Dados de localização: dados de geolocalização quando você acessa a loja;",
                  "Preferências: informações sobre suas preferências e interesses em relação aos produtos/serviços (quando você nos diz o que eles são ou quando os deduzimos do que sabemos sobre você);",
                  "Dados de navegação na loja: informações sobre suas visitas e atividades, incluindo o conteúdo (e quaisquer anúncios) com os quais você visualiza e interage, informações sobre o navegador e o dispositivo que você está usando, seu endereço IP, sua localização, o endereço do site a partir do qual você chegou. Algumas dessas informações são coletadas usando nossas Ferramentas de Coleta Automática de Dados, que incluem cookies, web beacons e links da web incorporados;",
                  "Dados anônimos ou agregados: respostas anônimas para pesquisas ou informações anônimas e agregadas sobre como a loja é usufruída. Durante nossas operações, em certos casos, aplicamos um processo de desidentificação ou pseudonimização aos seus dados para que seja razoavelmente improvável que você identifique você através do uso desses dados com a tecnologia disponível;",
                  "Outras informações que podemos coletar: informações que não revelem especificamente a sua identidade ou que não são diretamente relacionadas a um indivíduo, tais como informações sobre navegador e dispositivo; dados de uso da Loja; e informações coletadas por meio de cookies, pixel tags e outras tecnologias.",
                ]}
              />
              <LegalParagraph>
                Nós não coletamos Dados Pessoais Sensíveis.
              </LegalParagraph>

              <LegalTitle>Compartilhamento de Dados Pessoais com terceiros</LegalTitle>
              <LegalParagraph>
                Nós poderemos compartilhar seus Dados Pessoais:
              </LegalParagraph>
              <LegalList
                items={[
                  "Com a(s) empresa(s) parceira(s) que você selecionar ou optar em enviar os seus dados, dúvidas, perguntas etc., bem como com provedores de serviços ou parceiros para gerenciar ou suportar certos aspectos de nossas operações comerciais em nosso nome. Prestadores de serviços de hospedagem e armazenamento de dados, gerenciamento de fraudes, suporte ao cliente, vendas em nosso nome, atendimento de pedidos, personalização de conteúdo, atividades de publicidade e marketing (incluindo publicidade digital e personalizada) e serviços de TI, por exemplo;",
                  "Com terceiros, com o objetivo de nos ajudar a gerenciar a loja;",
                  "Com terceiros, caso ocorra qualquer reorganização, fusão, venda, joint venture, cessão, transmissão ou transferência de toda ou parte da nossa empresa, ativo ou capital (incluindo os relativos à falência ou processos semelhantes).",
                ]}
              />

              <LegalTitle>Coleta automática de Dados Pessoais</LegalTitle>
              <LegalParagraph>
                Quando você visita a loja, ela pode armazenar ou recuperar informações
                em seu navegador, principalmente na forma de cookies, que são arquivos
                de texto contendo pequenas quantidades de informação. Essas informações
                podem ser sobre você, suas preferências ou seu dispositivo e são usadas
                principalmente para que a loja funcione como você espera. As
                informações geralmente não o identificam diretamente, mas podem oferecer
                uma experiência na internet mais personalizada.
              </LegalParagraph>
              <LegalParagraph>
                De acordo com esta Política de Privacidade, nós e nossos prestadores de
                serviços terceirizados, mediante seu consentimento, podemos coletar
                seus Dados Pessoais de diversas formas, incluindo, entre outros:
              </LegalParagraph>
              <LegalList
                items={[
                  "Por meio do navegador ou do dispositivo: algumas informações são coletadas pela maior parte dos navegadores ou automaticamente por meio de dispositivos de acesso à internet, como o tipo de computador, resolução da tela, nome e versão do sistema operacional, modelo e fabricante do dispositivo, idioma, tipo e versão do navegador de Internet que está utilizando. Podemos utilizar essas informações para assegurar que a loja funcione adequadamente.",
                  "Uso de cookies: informações sobre o seu uso da loja podem ser coletadas por terceiros a partir de cookies. Cookies são informações armazenadas diretamente no computador que você está utilizando. Os cookies permitem a coleta de informações tais como o tipo de navegador, o tempo despendido na loja, as páginas visitadas, as preferências de idioma, e outros dados de tráfego anônimos. Nós e nossos prestadores de serviços utilizamos informações para proteção de segurança, para facilitar a navegação, exibir informações de modo mais eficiente, e personalizar sua experiência ao utilizar a loja, assim como para rastreamento online. Também coletamos informações estatísticas sobre o uso da loja para aprimoramento contínuo do nosso design e funcionalidade, para entender como a loja é utilizada e para auxiliá-lo a solucionar questões relativas à loja.",
                ]}
              />
              <LegalParagraph>
                Caso não deseje que suas informações sejam coletadas por meio de
                cookies, há um procedimento simples na maior parte dos navegadores que
                permite que os cookies sejam automaticamente rejeitados, ou oferece a
                opção de aceitar ou rejeitar a transferência de um cookie (ou cookies)
                específico(s) de um site determinado para o seu computador. Entretanto,
                isso pode gerar inconvenientes no uso da loja.
              </LegalParagraph>
              <LegalParagraph>
                As definições que escolher podem afetar a sua experiência de navegação e
                o funcionamento que exige a utilização de cookies. Neste sentido,
                rejeitamos qualquer responsabilidade pelas consequências resultantes do
                funcionamento limitado da loja provocado pela desativação de cookies no
                seu dispositivo (incapacidade de definir ou ler um cookie).
              </LegalParagraph>
              <LegalList
                items={[
                  "Uso de pixel tags e outras tecnologias similares: pixel tags (também conhecidos como Web beacons e GIFs invisíveis) podem ser utilizados para rastrear ações de usuários da loja (incluindo destinatários de e-mails), medir o sucesso das nossas campanhas de marketing e coletar dados estatísticos sobre o uso da loja e taxas de resposta, e ainda para outros fins não especificados. Podemos contratar empresas de publicidade comportamental, para obter relatórios sobre os anúncios da loja em toda a internet. Para isso, essas empresas utilizam cookies, pixel tags e outras tecnologias para coletar informações sobre a sua utilização, ou sobre a utilização de outros usuários, da nossa loja e de site de terceiros. Nós não somos responsáveis por pixel tags, cookies e outras tecnologias similares utilizadas por terceiros.",
                ]}
              />

              <LegalTitle>Categorias de cookies</LegalTitle>
              <LegalParagraph>
                Os cookies utilizados na nossa loja estão de acordo com os requisitos
                legais e são enquadrados nas seguintes categorias:
              </LegalParagraph>
              <LegalList
                items={[
                  "Estritamente necessários: estes cookies permitem que você navegue pelo site e desfrute de recursos essenciais com segurança. Um exemplo são os cookies de segurança, que autenticam os usuários, protegem os seus dados e evitam a criação de logins fraudulentos.",
                  "Desempenho: os cookies desta categoria coletam informações de forma codificada e anônima relacionadas à nossa loja virtual, como, por exemplo, o número de visitantes de uma página específica, origem das visitas ao site e quais as páginas acessadas pelo usuário. Todos os dados coletados são utilizados apenas para eventuais melhorias no site e para medir a eficácia da nossa comunicação.",
                  "Funcionalidade: estes cookies são utilizados para lembrar definições de preferências do usuário com o objetivo de melhorar a sua visita no nosso site, como, por exemplo, configurações aplicadas no layout do site ou suas respostas para pop-ups de promoções e cadastros -; dessa forma, não será necessário perguntar inúmeras vezes.",
                  "Publicidade: utilizamos cookies com o objetivo de criar campanhas segmentadas e entregar anúncios de acordo com o seu perfil de consumo na nossa loja virtual.",
                ]}
              />

              <LegalTitle>Direitos do Usuário</LegalTitle>
              <LegalParagraph>
                Respeitamos o seu direito à privacidade e a proteção de seus dados
                pessoais é fundamental para nós. Por isso, asseguramos que você tenha o
                controle sobre suas informações. Você pode, a qualquer momento,
                requerer: (i) confirmação de que seus Dados Pessoais estão sendo
                tratados; (ii) acesso aos seus Dados Pessoais; (iii) correções a dados
                incompletos, inexatos ou desatualizados; (iv) anonimização, bloqueio ou
                eliminação de dados desnecessários, excessivos ou tratados em
                desconformidade com o disposto em lei; (v) portabilidade de Dados
                Pessoais a outro prestador de serviços, contanto que isso não afete
                nossos segredos industriais e comerciais; (vi) eliminação de Dados
                Pessoais tratados com seu consentimento, na medida do permitido em lei;
                (vii) informações sobre as entidades às quais seus Dados Pessoais tenham
                sido compartilhados; (viii) informações sobre a possibilidade de não
                fornecer o consentimento e sobre as consequências da negativa; e (ix)
                revogação do consentimento.
              </LegalParagraph>
              <LegalParagraph>
                Nosso compromisso com a privacidade inclui medidas rigorosas de
                segurança para proteger suas informações. No entanto, também contamos
                com sua colaboração para garantir a segurança de seus dados. Se tiver
                alguma preocupação sobre como estamos processando suas informações, você
                pode entrar em contato com a autoridade de supervisão de proteção de
                dados em seu país.
              </LegalParagraph>
              <LegalParagraph>
                É importante destacar que, em algumas situações, podemos ser obrigados
                por lei a reter certas informações, mesmo que você solicite a exclusão.
                Entretanto, assim que essas obrigações forem cumpridas, suas
                informações serão excluídas.
              </LegalParagraph>
              <LegalParagraph>
                Estamos comprometidos em manter uma comunicação transparente sobre o
                tratamento de seus dados pessoais. Se tiver alguma dúvida ou precisar
                exercer seus direitos de privacidade, entre em contato conosco. Suas
                solicitações serão tratadas com especial cuidado para assegurar a
                eficácia dos seus direitos, podendo ser solicitada a comprovação de sua
                identidade para garantir a segurança e confidencialidade das
                informações compartilhadas.
              </LegalParagraph>
              <LegalParagraph>
                Agradecemos sua confiança em nós e reiteramos nosso compromisso em
                proteger sua privacidade e seus dados pessoais de acordo com a
                legislação aplicável.
              </LegalParagraph>

              <LegalTitle>Segurança dos Dados Pessoais</LegalTitle>
              <LegalParagraph>
                Buscamos adotar as medidas técnicas e organizacionais previstas pelas
                Leis de Proteção de Dados adequadas para proteção dos Dados Pessoais na
                nossa organização. Infelizmente, nenhuma transmissão ou sistema de
                armazenamento de dados tem a garantia de serem 100% seguros. Caso tenha
                motivos para acreditar que sua interação conosco tenha deixado de ser
                segura (por exemplo, caso acredite que a segurança de qualquer uma de
                suas contas foi comprometida), favor nos notificar imediatamente.
              </LegalParagraph>

              <LegalTitle>Atualizações desta Política de Privacidade</LegalTitle>
              <LegalParagraph>
                Se modificarmos nossa Política de Privacidade, publicaremos o novo
                texto no marketplace, com a data de revisão atualizada. Podemos alterar
                esta Política de Privacidade a qualquer momento. Caso haja alteração
                significativa nos termos desta Política de Privacidade, podemos
                informá-lo por meio das informações de contato que tivermos em nosso
                banco de dados ou por meio de notificação em nossa loja.
              </LegalParagraph>
              <LegalParagraph>
                Recordamos que nós temos como compromisso não tratar os seus Dados
                Pessoais de forma incompatível com os objetivos descritos acima, exceto
                se de outra forma requerido por lei ou ordem judicial.
              </LegalParagraph>
              <LegalParagraph>
                Sua utilização do marketplace após as alterações significa que aceitou
                as Políticas de Privacidade revisadas. Caso, após a leitura da versão
                revisada, você não esteja de acordo com seus termos, favor encerrar o
                acesso à loja.
              </LegalParagraph>

              <LegalTitle>Encarregado do tratamento dos Dados Pessoais</LegalTitle>
              <LegalParagraph>
                Caso pretenda exercer qualquer um dos direitos previstos, inclusive
                retirar o seu consentimento, nesta Política de Privacidade e/ou nas
                Leis de Proteção de Dados, ou resolver quaisquer dúvidas relacionadas
                ao Tratamento de seus Dados Pessoais, favor contatar-nos em{" "}
                <a
                  className="underline decoration-slate-500 underline-offset-2"
                  href="mailto:loja@papelitobrasil.com"
                >
                  loja@papelitobrasil.com
                </a>
                .
              </LegalParagraph>
            </div>
          </div>

          <div className="mt-16 w-full rounded-2xl bg-brand-dark px-6 py-7 text-center md:max-w-[832px] md:px-8 md:py-6">
            <h2 className="text-[24px] font-black leading-6 tracking-[-0.15px] text-white">
              Dúvidas sobre nossos termos?
            </h2>
            <p className="mt-2 text-[14px] leading-5 tracking-[-0.15px] text-white/50">
              Nossa equipe jurídica está disponível para esclarecimentos.
            </p>
            <a
              className="mt-4 inline-flex h-11 items-center rounded-full bg-brand-yellow px-6 text-[14px] font-black tracking-[-0.15px] text-brand-dark transition hover:bg-brand-yellow/90"
              href="mailto:juridico@papelito.com.br"
            >
              jurídico@papelito.com.br
            </a>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-[14px] font-medium text-slate-500">
            <Link className="underline-offset-2 hover:text-slate-700 hover:underline" href="/termos">
              Termos de Uso
            </Link>
            <span aria-hidden>•</span>
            <Link
              className="underline-offset-2 hover:text-slate-700 hover:underline"
              href="/privacidade"
            >
              Política de Privacidade
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
