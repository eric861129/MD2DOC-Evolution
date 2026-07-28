import { DOCUMENT_PROFILE_PRESETS, MARGIN_PRESETS, PAGE_SIZE_PRESETS } from './presets';
import type {
  ExportSettings,
  MarginConfigCm,
  MarginPresetId,
  PageSizePresetId,
  ResolvedMargins,
  ResolvedPageLayout,
} from './types';

const TWIPS_PER_INCH = 1440;
const CENTIMETRES_PER_INCH = 2.54;
const MINIMUM_CUSTOM_MARGIN_CM = 0.5;
const MAXIMUM_CUSTOM_MARGIN_CM = 5;
const MINIMUM_GUTTER_CM = 0;
const MAXIMUM_GUTTER_CM = 5;
const MINIMUM_CUSTOM_PAGE_SIZE_CM = 10;
const MAXIMUM_CUSTOM_PAGE_SIZE_CM = 100;
const MINIMUM_CONTENT_WIDTH_CM = 8;
const MINIMUM_CONTENT_HEIGHT_CM = 10;

const toTwips = (centimetres: number): number => Math.round(centimetres / CENTIMETRES_PER_INCH * TWIPS_PER_INCH);

const findPageSize = (id: Exclude<PageSizePresetId, 'custom'>) => {
  const preset = PAGE_SIZE_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`找不到紙張尺寸預設：${id}`);
  }
  return preset;
};

const findMarginPreset = (id: Exclude<MarginPresetId, 'custom'>): MarginConfigCm => {
  const preset = MARGIN_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`找不到邊界預設：${id}`);
  }
  return preset.margins;
};

const resolvePageSize = (settings: ExportSettings) => {
  if (settings.pageSizeId !== 'custom') {
    return findPageSize(settings.pageSizeId);
  }
  if (!settings.customPageSizeCm) {
    throw new Error('自訂紙張尺寸不可為空');
  }
  if (!Number.isFinite(settings.customPageSizeCm.width) || !Number.isFinite(settings.customPageSizeCm.height)) {
    throw new Error('自訂紙張尺寸必須為有限數值');
  }
  if (
    settings.customPageSizeCm.width < MINIMUM_CUSTOM_PAGE_SIZE_CM
    || settings.customPageSizeCm.width > MAXIMUM_CUSTOM_PAGE_SIZE_CM
    || settings.customPageSizeCm.height < MINIMUM_CUSTOM_PAGE_SIZE_CM
    || settings.customPageSizeCm.height > MAXIMUM_CUSTOM_PAGE_SIZE_CM
  ) {
    throw new Error('自訂紙張尺寸必須介於 10.00 至 100.00 公分之間');
  }
  return {
    id: 'custom' as const,
    widthCm: settings.customPageSizeCm.width,
    heightCm: settings.customPageSizeCm.height,
  };
};

const resolveMargins = (settings: ExportSettings): MarginConfigCm => {
  if (settings.marginPresetId !== 'custom') {
    return findMarginPreset(settings.marginPresetId);
  }
  if (!settings.customMargins) {
    throw new Error('自訂邊界不可為空');
  }
  return settings.customMargins;
};

const validateMarginCombination = (margins: MarginConfigCm): void => {
  if (margins.mode === 'mirrored' && margins.gutterPosition === 'top') {
    throw new Error('鏡像邊界不可搭配上方裝訂預留');
  }
};

const validateCustomMargins = (margins: MarginConfigCm): void => {
  const edgeValues = margins.mode === 'standard'
    ? [margins.topCm, margins.bottomCm, margins.leftCm, margins.rightCm]
    : [margins.topCm, margins.bottomCm, margins.insideCm, margins.outsideCm];
  const values = [...edgeValues, margins.gutterCm];

  if (values.some((value) => !Number.isFinite(value))) {
    throw new Error('自訂邊界必須為有限數值');
  }

  if (edgeValues.some((value) => value < MINIMUM_CUSTOM_MARGIN_CM || value > MAXIMUM_CUSTOM_MARGIN_CM)) {
    throw new Error('自訂邊界必須介於 0.50 至 5.00 公分之間');
  }
  if (margins.gutterCm < MINIMUM_GUTTER_CM || margins.gutterCm > MAXIMUM_GUTTER_CM) {
    throw new Error('裝訂預留必須介於 0.00 至 5.00 公分之間');
  }
};

const toResolvedMargins = (margins: MarginConfigCm): ResolvedMargins => {
  const leftCm = margins.mode === 'mirrored' ? margins.insideCm : margins.leftCm;
  const rightCm = margins.mode === 'mirrored' ? margins.outsideCm : margins.rightCm;

  return {
    mode: margins.mode,
    topCm: margins.topCm,
    rightCm,
    bottomCm: margins.bottomCm,
    leftCm,
    ...(margins.mode === 'mirrored'
      ? { insideCm: margins.insideCm, outsideCm: margins.outsideCm }
      : {}),
    gutterCm: margins.gutterCm,
    gutterPosition: margins.gutterPosition,
    topTwips: toTwips(margins.topCm),
    rightTwips: toTwips(rightCm),
    bottomTwips: toTwips(margins.bottomCm),
    leftTwips: toTwips(leftCm),
    gutterTwips: toTwips(margins.gutterCm),
  };
};

const isGeometryCustomized = (settings: ExportSettings): boolean => {
  const profileDefaults = DOCUMENT_PROFILE_PRESETS.find((profile) => profile.id === settings.profileId);
  if (!profileDefaults) {
    throw new Error(`找不到文件版型預設：${settings.profileId}`);
  }
  return settings.pageSizeId !== profileDefaults.pageSizeId
    || settings.marginPresetId !== profileDefaults.marginPresetId;
};

/** 將使用者的版面設定解析為 DOCX 與預覽可共用的實際幾何資料。 */
export const resolvePageLayout = (settings: ExportSettings): ResolvedPageLayout => {
  const page = resolvePageSize(settings);
  const marginConfig = resolveMargins(settings);
  validateMarginCombination(marginConfig);
  if (settings.marginPresetId === 'custom') {
    validateCustomMargins(marginConfig);
  }

  const margins = toResolvedMargins(marginConfig);
  const pageWidthTwips = toTwips(page.widthCm);
  const pageHeightTwips = toTwips(page.heightCm);
  const horizontalGutterCm = margins.gutterPosition === 'left' ? margins.gutterCm : 0;
  const verticalGutterCm = margins.gutterPosition === 'top' ? margins.gutterCm : 0;
  const horizontalGutterTwips = margins.gutterPosition === 'left' ? margins.gutterTwips : 0;
  const verticalGutterTwips = margins.gutterPosition === 'top' ? margins.gutterTwips : 0;
  const contentWidthCm = page.widthCm - margins.leftCm - margins.rightCm - horizontalGutterCm;
  const contentHeightCm = page.heightCm - margins.topCm - margins.bottomCm - verticalGutterCm;
  const contentWidthTwips = pageWidthTwips
    - margins.leftTwips
    - margins.rightTwips
    - horizontalGutterTwips;
  const contentHeightTwips = pageHeightTwips
    - margins.topTwips
    - margins.bottomTwips
    - verticalGutterTwips;
  if (contentWidthCm < MINIMUM_CONTENT_WIDTH_CM) {
    throw new Error('有效內容寬度不得小於 8 公分');
  }
  if (contentHeightCm < MINIMUM_CONTENT_HEIGHT_CM) {
    throw new Error('有效內容高度不得小於 10 公分');
  }

  const warnings: string[] = [];
  const marginValues = margins.mode === 'mirrored'
    ? [margins.topCm, margins.bottomCm, margins.insideCm!, margins.outsideCm!]
    : [margins.topCm, margins.bottomCm, margins.leftCm, margins.rightCm];
  if (marginValues.some((value) => value < 1)) {
    warnings.push('邊界小於 1 公分，列印時可能有裁切風險。');
  }

  const isCustomizedFromProfile = isGeometryCustomized(settings);
  if (settings.profileId === 'publisher-exact' && isCustomizedFromProfile) {
    warnings.push('已自訂；不保證與出版社參考稿頁碼一致');
  }

  return {
    page: {
      widthCm: page.widthCm,
      heightCm: page.heightCm,
      widthTwips: pageWidthTwips,
      heightTwips: pageHeightTwips,
    },
    margins,
    content: {
      widthCm: contentWidthCm,
      heightCm: contentHeightCm,
      widthTwips: contentWidthTwips,
      heightTwips: contentHeightTwips,
    },
    isCustomizedFromProfile,
    warnings,
  };
};
