import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Select } from '../ui/Select';
import {
  DOCUMENT_PROFILE_PRESETS,
  MARGIN_PRESETS,
  PAGE_SIZE_PRESETS,
} from '../../services/docx/layout/presets';
import { resolvePageLayout } from '../../services/docx/layout/resolve';
import type {
  ExportSettings,
  MarginConfigCm,
  MarginPresetId,
  PageSizePresetId,
} from '../../services/docx/layout/types';

interface ExportSettingsModalProps {
  isOpen: boolean;
  value: ExportSettings;
  onClose: () => void;
  onApply: (settings: ExportSettings) => void;
  t: (key: string) => string;
}

type MarginInputField = 'topCm' | 'bottomCm' | 'leftCm' | 'rightCm' | 'insideCm' | 'outsideCm' | 'gutterCm';

const getPresetMargins = (id: Exclude<MarginPresetId, 'custom'>): MarginConfigCm => {
  const preset = MARGIN_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) {
    throw new Error(`找不到邊界預設：${id}`);
  }
  return preset.margins;
};

const getDraftMargins = (settings: ExportSettings): MarginConfigCm =>
  settings.marginPresetId === 'custom'
    ? settings.customMargins ?? getPresetMargins('balanced')
    : getPresetMargins(settings.marginPresetId);

const createCustomMargins = (margins: MarginConfigCm): MarginConfigCm => ({
  ...margins,
  gutterCm: Math.max(0.5, margins.gutterCm),
});

const toNumber = (value: string): number => Number(value);

export const ExportSettingsModal: React.FC<ExportSettingsModalProps> = ({
  isOpen,
  value,
  onClose,
  onApply,
  t,
}) => {
  const [draft, setDraft] = useState<ExportSettings>(value);

  useEffect(() => {
    if (isOpen) {
      setDraft(value);
    }
  }, [isOpen, value]);

  const margins = getDraftMargins(draft);
  const resolved = useMemo(() => {
    try {
      return { layout: resolvePageLayout(draft), error: null };
    } catch {
      return { layout: null, error: t('layout.invalidGeometry') };
    }
  }, [draft, t]);

  const hasPrintRisk = margins.mode === 'standard'
    ? [margins.topCm, margins.bottomCm, margins.leftCm, margins.rightCm].some((margin) => margin < 1)
    : [margins.topCm, margins.bottomCm, margins.insideCm, margins.outsideCm].some((margin) => margin < 1);
  const hasExactProfileWarning = draft.profileId === 'publisher-exact'
    && (draft.pageSizeId !== 'tech' || draft.marginPresetId !== 'publisher-exact');
  const isCustomMargin = draft.marginPresetId === 'custom';

  const setProfile = (profileId: ExportSettings['profileId']) => {
    const profile = DOCUMENT_PROFILE_PRESETS.find((candidate) => candidate.id === profileId);
    if (!profile) return;
    setDraft({
      profileId,
      pageSizeId: profile.pageSizeId,
      marginPresetId: profile.marginPresetId,
    });
  };

  const setPageSize = (pageSizeId: PageSizePresetId) => {
    if (pageSizeId === 'custom') {
      const current = resolved.layout?.page;
      setDraft({
        ...draft,
        pageSizeId,
        customPageSizeCm: {
          width: current?.widthCm ?? 17,
          height: current?.heightCm ?? 23,
        },
      });
      return;
    }
    setDraft({ ...draft, pageSizeId, customPageSizeCm: undefined });
  };

  const setMarginPreset = (marginPresetId: MarginPresetId) => {
    if (marginPresetId === 'custom') {
      setDraft({
        ...draft,
        marginPresetId,
        customMargins: createCustomMargins(margins),
      });
      return;
    }
    setDraft({ ...draft, marginPresetId, customMargins: undefined });
  };

  const updateCustomMargins = (nextMargins: MarginConfigCm) => {
    setDraft({ ...draft, marginPresetId: 'custom', customMargins: nextMargins });
  };

  const updateMarginValue = (field: MarginInputField, rawValue: string) => {
    const numericValue = toNumber(rawValue);
    updateCustomMargins({ ...margins, [field]: numericValue } as MarginConfigCm);
  };

  const setMarginMode = (mode: MarginConfigCm['mode']) => {
    if (mode === margins.mode) return;
    if (mode === 'standard') {
      updateCustomMargins({
        mode,
        topCm: margins.topCm,
        bottomCm: margins.bottomCm,
        leftCm: margins.mode === 'mirrored' ? margins.insideCm : margins.leftCm,
        rightCm: margins.mode === 'mirrored' ? margins.outsideCm : margins.rightCm,
        gutterCm: margins.gutterCm,
        gutterPosition: margins.gutterPosition,
      });
      return;
    }
    updateCustomMargins({
      mode,
      topCm: margins.topCm,
      bottomCm: margins.bottomCm,
      insideCm: margins.mode === 'standard' ? margins.leftCm : margins.insideCm,
      outsideCm: margins.mode === 'standard' ? margins.rightCm : margins.outsideCm,
      gutterCm: margins.gutterCm,
      gutterPosition: margins.gutterPosition,
    });
  };

  const updatePageSize = (field: 'width' | 'height', rawValue: string) => {
    const current = draft.customPageSizeCm ?? { width: 17, height: 23 };
    setDraft({
      ...draft,
      pageSizeId: 'custom',
      customPageSizeCm: { ...current, [field]: toNumber(rawValue) },
    });
  };

  const inputClassName = 'mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800';
  const renderMarginInput = (label: string, field: MarginInputField, inputValue: number) => (
    <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      <input
        aria-label={label}
        className={inputClassName}
        disabled={!isCustomMargin}
        type="number"
        step="0.01"
        min="0.5"
        max="5"
        value={inputValue}
        onChange={(event) => updateMarginValue(field, event.target.value)}
      />
    </label>
  );

  const handleApply = () => {
    if (resolved.error) return;
    onApply(draft);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('layout.openSettings')}>
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t('layout.profile')}</div>
            <Select aria-label={t('layout.profile')} value={draft.profileId} onChange={(event) => setProfile(event.target.value as ExportSettings['profileId'])}>
              {DOCUMENT_PROFILE_PRESETS.map((profile) => (
                <option key={profile.id} value={profile.id}>{t(`layout.profiles.${profile.id}`)}</option>
              ))}
            </Select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t('layout.pageSize')}</div>
            <Select aria-label={t('layout.pageSize')} value={draft.pageSizeId} onChange={(event) => setPageSize(event.target.value as PageSizePresetId)}>
              {PAGE_SIZE_PRESETS.map((size) => (
                <option key={size.id} value={size.id}>{t(`sizes.${size.id}`)}</option>
              ))}
              <option value="custom">{t('layout.custom')}</option>
            </Select>
          </div>
          <div>
            <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t('layout.marginPreset')}</div>
            <Select aria-label={t('layout.marginPreset')} value={draft.marginPresetId} onChange={(event) => setMarginPreset(event.target.value as MarginPresetId)}>
              {MARGIN_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>{t(`layout.marginPresets.${preset.id}`)}</option>
              ))}
              <option value="custom">{t('layout.custom')}</option>
            </Select>
          </div>
          {isCustomMargin && (
            <div>
              <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">{t('layout.marginMode')}</div>
              <Select aria-label={t('layout.marginMode')} value={margins.mode} onChange={(event) => setMarginMode(event.target.value as MarginConfigCm['mode'])}>
                <option value="standard">{t('layout.standardMargins')}</option>
                <option value="mirrored">{t('layout.mirroredMargins')}</option>
              </Select>
            </div>
          )}
        </div>

        {draft.pageSizeId === 'custom' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('layout.pageWidth')} (cm)
              <input aria-label={`${t('layout.pageWidth')} (cm)`} className={inputClassName} type="number" step="0.01" min="10" max="100" value={draft.customPageSizeCm?.width ?? ''} onChange={(event) => updatePageSize('width', event.target.value)} />
            </label>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
              {t('layout.pageHeight')} (cm)
              <input aria-label={`${t('layout.pageHeight')} (cm)`} className={inputClassName} type="number" step="0.01" min="10" max="100" value={draft.customPageSizeCm?.height ?? ''} onChange={(event) => updatePageSize('height', event.target.value)} />
            </label>
          </div>
        )}

        <section className="space-y-3 rounded-md border border-slate-200 p-4 dark:border-slate-800">
          <h3 className="font-semibold text-slate-950 dark:text-white">
            {margins.mode === 'standard' ? t('layout.standardMargins') : t('layout.mirroredMargins')}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {renderMarginInput(`${t('layout.topMargin')} (cm)`, 'topCm', margins.topCm)}
            {renderMarginInput(`${t('layout.bottomMargin')} (cm)`, 'bottomCm', margins.bottomCm)}
            {margins.mode === 'standard' ? (
              <>
                {renderMarginInput(`${t('layout.leftMargin')} (cm)`, 'leftCm', margins.leftCm)}
                {renderMarginInput(`${t('layout.rightMargin')} (cm)`, 'rightCm', margins.rightCm)}
              </>
            ) : (
              <>
                {renderMarginInput(`${t('layout.insideMargin')} (cm)`, 'insideCm', margins.insideCm)}
                {renderMarginInput(`${t('layout.outsideMargin')} (cm)`, 'outsideCm', margins.outsideCm)}
              </>
            )}
            {renderMarginInput(`${t('layout.gutter')} (cm)`, 'gutterCm', margins.gutterCm)}
            <Select aria-label={t('layout.gutterPosition')} disabled={!isCustomMargin} value={margins.gutterPosition} onChange={(event) => updateCustomMargins({ ...margins, gutterPosition: event.target.value as 'left' | 'top' })}>
              <option value="left">{t('layout.gutterLeft')}</option>
              <option value="top">{t('layout.gutterTop')}</option>
            </Select>
          </div>
        </section>

        <section className="rounded-md bg-slate-100 p-4 text-sm dark:bg-slate-800">
          <div className="font-semibold text-slate-950 dark:text-white">{t('layout.contentArea')}</div>
          <div className="mt-1 text-slate-600 dark:text-slate-300">
            {resolved.layout
              ? `${resolved.layout.content.widthCm.toFixed(2)} × ${resolved.layout.content.heightCm.toFixed(2)} cm`
              : t('layout.notAvailable')}
          </div>
        </section>

        {(resolved.error || hasPrintRisk || hasExactProfileWarning) && (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-100">
            {resolved.error && <p>{resolved.error}</p>}
            {hasPrintRisk && <p>{t('layout.printRiskWarning')}</p>}
            {hasExactProfileWarning && <p>{t('layout.customizedWarning')}</p>}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>{t('layout.cancel')}</Button>
          <Button type="button" onClick={handleApply} disabled={Boolean(resolved.error)}>{t('layout.apply')}</Button>
        </div>
      </div>
    </Modal>
  );
};
