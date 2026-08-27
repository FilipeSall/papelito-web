import { beforeEach, describe, expect, it, vi } from "vitest";

const getMessageThreadsMock = vi.fn();
const getMessageThreadMock = vi.fn();

vi.mock("@/features/messages", () => ({
  MessageThreadsList: () => null,
  MessageThreadPanel: () => null,
  getMessageThreads: () => getMessageThreadsMock(),
  getMessageThread: (id: number) => getMessageThreadMock(id),
}));

const { SupportContent } = await import("./support-content");

const thread = (threadId: number) => ({ threadId, subject: `thread ${threadId}` });

describe("SupportContent", () => {
  beforeEach(() => {
    getMessageThreadsMock.mockReset();
    getMessageThreadMock.mockReset();
    getMessageThreadsMock.mockResolvedValue({ items: [thread(10), thread(20)] });
    getMessageThreadMock.mockImplementation(async (id: number) => thread(id));
  });

  it("abre a thread pedida na URL", async () => {
    await SupportContent({ searchParams: { thread: "20" } });

    expect(getMessageThreadMock).toHaveBeenCalledExactlyOnceWith(20);
  });

  it("sem thread na URL, abre a primeira da lista", async () => {
    await SupportContent({ searchParams: {} });

    expect(getMessageThreadMock).toHaveBeenCalledExactlyOnceWith(10);
  });

  it("ignora valor não numérico e volta para a primeira da lista", async () => {
    await SupportContent({ searchParams: { thread: "abc" } });

    expect(getMessageThreadMock).toHaveBeenCalledExactlyOnceWith(10);
  });

  it("não carrega thread nenhuma quando a lista está vazia", async () => {
    getMessageThreadsMock.mockResolvedValue({ items: [] });

    await SupportContent({ searchParams: {} });

    expect(getMessageThreadMock).not.toHaveBeenCalled();
  });

  it("com a thread na URL, não espera a lista chegar para buscá-la", async () => {
    let liberarLista: (value: unknown) => void = () => undefined;
    getMessageThreadsMock.mockReturnValue(
      new Promise((resolve) => {
        liberarLista = resolve;
      }),
    );

    const rendering = SupportContent({ searchParams: { thread: "20" } });
    await Promise.resolve();

    expect(getMessageThreadMock).toHaveBeenCalledWith(20);

    liberarLista({ items: [thread(10)] });
    await rendering;
  });
});
