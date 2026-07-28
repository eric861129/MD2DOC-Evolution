export type DocumentProfileId =
  | 'technical-legacy'
  | 'publisher-exact'
  | 'publisher-narrow'
  | 'publisher-binding';

export type PageSizePresetId = 'tech' | 'a4' | 'a5' | 'b5' | 'custom';
export type MarginPresetId =
  | 'narrow'
  | 'compact'
  | 'balanced'
  | 'standard'
  | 'publisher-exact'
  | 'publisher-binding'
  | 'custom';

export type MarginConfigCm =
  | {
      mode: 'standard';
      topCm: number;
      bottomCm: number;
      leftCm: number;
      rightCm: number;
      gutterCm: number;
      gutterPosition: 'left' | 'top';
    }
  | {
      mode: 'mirrored';
      topCm: number;
      bottomCm: number;
      insideCm: number;
      outsideCm: number;
      gutterCm: number;
      gutterPosition: 'left' | 'top';
    };

export interface ExportSettings {
  profileId: DocumentProfileId;
  pageSizeId: PageSizePresetId;
  marginPresetId: MarginPresetId;
  customPageSizeCm?: { width: number; height: number };
  customMargins?: MarginConfigCm;
}

export interface ResolvedMargins {
  mode: 'standard' | 'mirrored';
  topCm: number;
  rightCm: number;
  bottomCm: number;
  leftCm: number;
  insideCm?: number;
  outsideCm?: number;
  gutterCm: number;
  gutterPosition: 'left' | 'top';
  topTwips: number;
  rightTwips: number;
  bottomTwips: number;
  leftTwips: number;
  gutterTwips: number;
}

export interface ResolvedPageLayout {
  page: {
    widthCm: number;
    heightCm: number;
    widthTwips: number;
    heightTwips: number;
  };
  margins: ResolvedMargins;
  content: {
    widthCm: number;
    heightCm: number;
    widthTwips: number;
  };
  isCustomizedFromProfile: boolean;
  warnings: string[];
}

export interface PageSizePreset {
  id: Exclude<PageSizePresetId, 'custom'>;
  widthCm: number;
  heightCm: number;
}

export interface MarginPreset {
  id: Exclude<MarginPresetId, 'custom'>;
  margins: MarginConfigCm;
}
