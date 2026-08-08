export type RichTextTextNode = {
  type: "text";
  text: string;
  bold?: boolean;
  italic?: boolean;
};

export type RichTextTokenNode = {
  type: "token";
  token: string;
  params?: Record<string, string>;
  bold?: boolean;
  italic?: boolean;
};

export type RichTextNode = RichTextTextNode | RichTextTokenNode;

export type RichTextDocument = RichTextNode[];

export type ResolvedRichTextNode = {
  text: string;
  bold: boolean;
  italic: boolean;
};

export const RICH_TEXT_MAX_NODES = 40;
export const RICH_TEXT_MAX_PLAIN_LENGTH = 120;
