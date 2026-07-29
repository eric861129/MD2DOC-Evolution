import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportSettingsModal } from '../components/editor/ExportSettingsModal';
import { formatLayoutSummary } from '../components/editor/EditorHeader';
import { DEFAULT_EXPORT_SETTINGS } from '../services/docx/layout/presets';
import { resources } from '../services/i18n';

vi.mock('../constants/meta', () => ({ APP_VERSION: 'test' }));

const t = (key: string): string => key.split('.').reduce<unknown>((value, segment) => (
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)[segment]
    : undefined
), resources.zh.translation) as string ?? key;
const cmLabel = (key: string) => `${t(key)} (cm)`;

describe('ExportSettingsModal', () => {
  it('loads the narrow profile page and margin defaults before applying settings', () => {
    const onApply = vi.fn();

    render(
      <ExportSettingsModal
        isOpen
        value={DEFAULT_EXPORT_SETTINGS}
        onClose={vi.fn()}
        onApply={onApply}
        t={t}
      />,
    );

    fireEvent.change(screen.getByLabelText(t('layout.profile')), {
      target: { value: 'publisher-narrow' },
    });
    fireEvent.click(screen.getByRole('button', { name: t('layout.apply') }));

    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({
      profileId: 'publisher-narrow',
      pageSizeId: 'tech',
      marginPresetId: 'narrow',
    }));
  });

  it('warns when a custom edge margin is below one centimetre', () => {
    render(
      <ExportSettingsModal
        isOpen
        value={DEFAULT_EXPORT_SETTINGS}
        onClose={vi.fn()}
        onApply={vi.fn()}
        t={t}
      />,
    );

    fireEvent.change(screen.getByLabelText(t('layout.marginPreset')), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText(cmLabel('layout.topMargin')), {
      target: { value: '0.8' },
    });

    expect(screen.getByText(t('layout.printRiskWarning'))).toBeInTheDocument();
  });

  it('disables apply when the selected geometry leaves too little content width', () => {
    render(
      <ExportSettingsModal
        isOpen
        value={DEFAULT_EXPORT_SETTINGS}
        onClose={vi.fn()}
        onApply={vi.fn()}
        t={t}
      />,
    );

    fireEvent.change(screen.getByLabelText(t('layout.pageSize')), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText(cmLabel('layout.pageWidth')), {
      target: { value: '10' },
    });

    expect(screen.getByRole('button', { name: t('layout.apply') })).toBeDisabled();
  });

  it('disables apply when a custom page is smaller than 10 centimetres', () => {
    render(
      <ExportSettingsModal
        isOpen
        value={DEFAULT_EXPORT_SETTINGS}
        onClose={vi.fn()}
        onApply={vi.fn()}
        t={t}
      />,
    );

    fireEvent.change(screen.getByLabelText(t('layout.pageSize')), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText(cmLabel('layout.pageWidth')), {
      target: { value: '9.99' },
    });

    expect(screen.getByRole('button', { name: t('layout.apply') })).toBeDisabled();
  });

  it('warns that an overridden exact publisher profile may change pagination', () => {
    render(
      <ExportSettingsModal
        isOpen
        value={{ ...DEFAULT_EXPORT_SETTINGS, profileId: 'publisher-exact' }}
        onClose={vi.fn()}
        onApply={vi.fn()}
        t={t}
      />,
    );

    fireEvent.change(screen.getByLabelText(t('layout.marginPreset')), {
      target: { value: 'narrow' },
    });

    expect(screen.getByText(t('layout.customizedWarning'))).toBeInTheDocument();
  });

  it('shows mirrored inside, outside, and gutter controls for binding margins', () => {
    render(
      <ExportSettingsModal
        isOpen
        value={{ ...DEFAULT_EXPORT_SETTINGS, profileId: 'publisher-binding', marginPresetId: 'publisher-binding' }}
        onClose={vi.fn()}
        onApply={vi.fn()}
        t={t}
      />,
    );

    expect(screen.getByLabelText(cmLabel('layout.insideMargin'))).toBeInTheDocument();
    expect(screen.getByLabelText(cmLabel('layout.outsideMargin'))).toBeInTheDocument();
    expect(screen.getByLabelText(cmLabel('layout.gutter'))).toBeInTheDocument();
  });

  it('uses real Traditional Chinese layout resources and the published separators', () => {
    expect(resources.zh.translation.layout.openSettings).toBe('版面設定');
    expect(resources.zh.translation.layout.gutter).toBe('裝訂預留');
    expect(resources.zh.translation.layout.printRiskWarning).toBe('邊界小於 1 公分，部分印表機可能無法完整列印。');
    expect(formatLayoutSummary({ widthCm: 17.6, heightCm: 23.6, leftMarginCm: 2 }, t('layout.marginPresets.balanced')))
      .toBe('17.60×23.60 cm · 平衡 2.00 cm');
  });
});
