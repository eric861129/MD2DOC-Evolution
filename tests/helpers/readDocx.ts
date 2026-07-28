import JSZip from 'jszip';

export const readDocxXml = async (blob: Blob, path: string): Promise<string> => {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  const entry = zip.file(path);
  if (!entry) {
    throw new Error(`DOCX 缺少必要項目：${path}`);
  }
  return entry.async('string');
};

export const listDocxEntries = async (blob: Blob): Promise<string[]> => {
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  return Object.keys(zip.files).sort();
};
