import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagInputField } from "./tag-input-field";

const tag = { id: 215, name: "teste", parent: 0, slug: "teste" };

describe("TagInputField", () => {
  it("commits a normalized tag name on Enter and comma", () => {
    const onCreateTag = vi.fn();
    const props = {
      isCreating: false,
      newTagName: "  teste,  ",
      onCreateTag,
      onNewTagNameChange: vi.fn(),
      onRemoveTag: vi.fn(),
      selectedIds: [],
      tags: [],
    };
    const { rerender } = render(<TagInputField {...props} />);
    const input = screen.getByRole("textbox");

    fireEvent.keyDown(input, { key: "Enter" });
    expect(onCreateTag).toHaveBeenLastCalledWith("teste");

    rerender(<TagInputField {...props} newTagName="artesanal," />);
    fireEvent.keyDown(input, { key: "," });
    expect(onCreateTag).toHaveBeenLastCalledWith("artesanal");
  });

  it("shows selected tags and removes only their association from the draft", () => {
    const onRemoveTag = vi.fn();
    render(
      <TagInputField
        isCreating={false}
        newTagName=""
        onCreateTag={vi.fn()}
        onNewTagNameChange={vi.fn()}
        onRemoveTag={onRemoveTag}
        selectedIds={["215"]}
        tags={[tag]}
      />,
    );

    expect(screen.getByText("teste")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remover tag teste" }));
    expect(onRemoveTag).toHaveBeenCalledWith("215");
  });
});
