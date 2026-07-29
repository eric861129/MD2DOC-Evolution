import type { ExportSettings, MarginPreset, PageSizePreset } from './types';

type DocumentProfilePreset = {
  id: ExportSettings['profileId'];
  pageSizeId: ExportSettings['pageSizeId'];
  marginPresetId: ExportSettings['marginPresetId'];
};

/** 文件版型與其預設紙張、邊界組合，供介面選擇時一致套用。 */
export const DOCUMENT_PROFILE_PRESETS = [
  { id: 'publisher-exact', pageSizeId: 'tech', marginPresetId: 'publisher-exact' },
  { id: 'publisher-narrow', pageSizeId: 'tech', marginPresetId: 'narrow' },
  { id: 'publisher-binding', pageSizeId: 'tech', marginPresetId: 'publisher-binding' },
] as const satisfies readonly DocumentProfilePreset[];

/**
 * 版面解析器使用的完整幾何預設。
 * technical-legacy 僅供內部回歸，不會出現在新版使用者介面。
 */
export const DOCUMENT_PROFILE_GEOMETRY_DEFAULTS = [
  { id: 'technical-legacy', pageSizeId: 'tech', marginPresetId: 'standard' },
  ...DOCUMENT_PROFILE_PRESETS,
] as const satisfies readonly DocumentProfilePreset[];

export const PAGE_SIZE_PRESETS: readonly PageSizePreset[] = [
  { id: 'tech', widthCm: 17.6, heightCm: 23.6 },
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
  {
    id: 'publisher-exact',
    margins: {
      mode: 'standard',
      topCm: 2.1,
      bottomCm: 2.1,
      leftCm: 2.3,
      rightCm: 2.3,
      gutterCm: 0,
      gutterPosition: 'left',
    },
  },
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

/** 新版預設採出版社精確版型，紙張使用 17.6 × 23.6 公分。 */
export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  profileId: 'publisher-exact',
  pageSizeId: 'tech',
  marginPresetId: 'publisher-exact',
};
