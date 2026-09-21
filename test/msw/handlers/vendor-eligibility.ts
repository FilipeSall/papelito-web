import { http, HttpResponse } from "msw";

type Config = { minimumBoxes: number; recommendedBoxes: number };

const DEFAULT_CONFIG: Config = { minimumBoxes: 2, recommendedBoxes: 3 };

let storedConfig: Config = { ...DEFAULT_CONFIG };

export function setVendorEligibilityConfig(config: Partial<Config>) {
  storedConfig = { ...DEFAULT_CONFIG, ...config };
}

export function getVendorEligibilityConfig(): Config {
  return storedConfig;
}

export function resetVendorEligibilityConfig() {
  storedConfig = { ...DEFAULT_CONFIG };
}

/**
 * Handlers MSW da configuração administrativa de caixas do vendor.
 *
 * Reproduz a recusa do WordPress quando o recomendado fica abaixo do mínimo, porque é a única
 * validação que o painel não repete e precisa saber exibir.
 */
export const vendorEligibilityHandlers = [
  http.get("*/api/admin/vendor-eligibility", () => HttpResponse.json(storedConfig)),
  http.put("*/api/admin/vendor-eligibility", async ({ request }) => {
    const body = (await request.json()) as Partial<Config>;
    const minimumBoxes = Number(body.minimumBoxes);
    const recommendedBoxes = Number(body.recommendedBoxes);

    if (recommendedBoxes < minimumBoxes) {
      return HttpResponse.json(
        { message: "O recomendado de caixas não pode ser menor que o mínimo." },
        { status: 422 },
      );
    }

    storedConfig = { minimumBoxes, recommendedBoxes };

    return HttpResponse.json(storedConfig);
  }),
];
