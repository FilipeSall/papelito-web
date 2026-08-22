import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useTemporaryAdminMedia } from "./use-temporary-admin-media";

describe("useTemporaryAdminMedia", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not delete tracked media when the editor unmounts during a save", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { result, unmount } = renderHook(() => useTemporaryAdminMedia());

    result.current.track(71);
    result.current.beginSave();
    unmount();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("cleans tracked media on unmount when no save is in flight", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const { result, unmount } = renderHook(() => useTemporaryAdminMedia());

    result.current.track(71);
    unmount();

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/admin/media",
      expect.objectContaining({
        body: JSON.stringify({ ids: [71] }),
        method: "DELETE",
      }),
    );
  });
});
