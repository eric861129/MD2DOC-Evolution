import type { ExportSettings, MarginPreset, PageSizePreset } from './types';

type DocumentProfilePreset = {
  id: ExportSettings['profileId'];
  pageSizeId: ExportSettings['pageSizeId'];
  marginPresetId: ExportSettings['marginPresetId'];
};

/** 文件版型與其預設紙張、邊界組合，供介面選擇時一致套用。 */
export const DOCUMENT_PROFILE_PRESETS = [
  { id: 'technical-legacy', pageSizeId: 'tech', marginPresetId: 'publisher-exact' },
  { id: 'publisher-exact', pageSizeId: 'tech', marginPresetId: 'publisher-exact' },
  { id: 'publisher-narrow', pageSizeId: 'tech', marginPresetId: 'narrow' },
  { id: 'publisher-binding', pageSizeId: 'tech', marginPresetId: 'publisher-binding' },
] as const satisfies readonly DocumentProfilePreset[];

export const PAGE_SIZE_PRESETS: readonly PageSizePreset[] = [
  { id: 'tech', widthCm: 17, heightCm: 23 },
  { id: 'a4', widthCm: 21, heightCm: 29.7 },
  { id: 'a5', widthCm: 14.8, heightCm: 21 },
  { id: 'b5', widthCm: 17.6, heightCm: 25 },
];

const createStandardMargins = (valueCm: number) => ({
  mode: 'standard' as const,
  topCm: valueCm,
  bottomCm: valueCm,
  leftCm: valueCm,
  rightCm: valueCm,
  gutterCm: 0,
  gutterPosition: 'left' as const,
});

export const MARGIN_PRESETS: readonly MarginPreset[] = [
  { id: 'narrow', margins: createStandardMargins(1.27) },
  { id: 'compact', margins: createStandardMargins(1.5) },
  { id: 'balanced', margins: createStandardMargins(2) },
  { id: 'standard', margins: createStandardMargins(2.54) },
  { id: 'publisher-exact', margins: createStandardMargins(2.54) },
  {
    id: 'publisher-binding',
    margins: {
      mode: 'mirrored',
      topCm: 2,
      bottomCm: 2.2,
      insideCm: 2.2,
      outsideCm: 1.8,
      gutterCm: 0.5,
      gutterPosition: 'left',
    },
  },
];

/** 保持舊版匯出幾何，避免升級後默默改變既有文件。 */
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  profileId: 'technical-legacy',
  pageSizeId: 'tech',
  marginPresetId: 'publisher-exact',
};
