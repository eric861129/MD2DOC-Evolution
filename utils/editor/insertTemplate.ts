export interface EditorInsertion {
  content: string;
  insertedText: string;
  selectionStart: number;
  selectionEnd: number;
}

const startsWithLineBreak = (value: string): boolean => /^(?:\r\n|\r|\n)/.test(value);
const endsWithLineBreak = (value: string): boolean => /(?:\r\n|\r|\n)$/.test(value);

export const createEditorInsertion = (
  content: string,
  template: string,
  selectionStart: number,
  selectionEnd: number,
): EditorInsertion => {
  const before = content.substring(0, selectionStart);
  let after = content.substring(selectionEnd);
  let insertedText = template;

  if (endsWithLineBreak(before) && startsWithLineBreak(insertedText)) {
    insertedText = insertedText.replace(/^(?:\r\n|\r|\n)/, '');
  } else if (
    before.length > 0
    && !endsWithLineBreak(before)
    && !startsWithLineBreak(insertedText)
  ) {
    insertedText = `\n${insertedText}`;
  }

  if (endsWithLineBreak(insertedText) && startsWithLineBreak(after)) {
    after = after.replace(/^(?:\r\n|\r|\n)/, '');
  } else if (
    after.length > 0
    && !endsWithLineBreak(insertedText)
    && !startsWithLineBreak(after)
  ) {
    insertedText = `${insertedText}\n`;
  }

  const caret = selectionStart + insertedText.length;
  return {
    content: before + insertedText + after,
    insertedText,
    selectionStart: caret,
    selectionEnd: caret,
  };
};
