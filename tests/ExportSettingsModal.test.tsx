import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportSettingsModal } from '../components/editor/ExportSettingsModal';
import { DEFAULT_EXPORT_SETTINGS } from '../services/docx/layout/presets';

const translations: Record<string, string> = {
  'layout.openSettings': '版面設定',
  'layout.profile': '文件版型',
  'layout.pageSize': '紙張尺寸',
  'layout.marginPreset': '頁面邊界',
  'layout.standardMargins': '一般邊界',
  'layout.mirroredMargins': '鏡像邊界',
  'layout.marginMode': '邊界模式',
  'layout.topMargin': '上邊界',
  'layout.bottomMargin': '下邊界',
  'layout.leftMargin': '左邊界',
  'layout.rightMargin': '右邊界',
  'layout.insideMargin': '內側邊界',
  'layout.outsideMargin': '外側邊界',
  'layout.gutter': '裝訂預留',
  'layout.gutterPosition': '裝訂預留位置',
  'layout.gutterLeft': '左側',
  'layout.gutterTop': '上方',
  'layout.pageWidth': '紙張寬度',
  'layout.pageHeight': '紙張高度',
  'layout.contentArea': '有效內容區域',
  'layout.apply': '套用版面設定',
  'layout.cancel': '取消',
  'layout.custom': '自訂',
  'layout.notAvailable': '無法計算',
  'layout.invalidGeometry': '目前的紙張與邊界設定無法產生有效內容區域。',
  'layout.customizedWarning': '已自訂出版社版型，頁碼可能與參考稿不同。',
  'layout.printRiskWarning': '邊界小於 1 公分，部分印表機可能無法完整列印。',
};

const t = (key: string) => translations[key] ?? key;

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

    fireEvent.change(screen.getByLabelText('文件版型'), {
      target: { value: 'publisher-narrow' },
    });
    fireEvent.click(screen.getByRole('button', { name: '套用版面設定' }));

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

    fireEvent.change(screen.getByLabelText('頁面邊界'), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText('上邊界 (cm)'), {
      target: { value: '0.8' },
    });

    expect(screen.getByText('邊界小於 1 公分，部分印表機可能無法完整列印。')).toBeInTheDocument();
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

    fireEvent.change(screen.getByLabelText('紙張尺寸'), {
      target: { value: 'custom' },
    });
    fireEvent.change(screen.getByLabelText('紙張寬度 (cm)'), {
      target: { value: '10' },
    });

    expect(screen.getByRole('button', { name: '套用版面設定' })).toBeDisabled();
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

    fireEvent.change(screen.getByLabelText('頁面邊界'), {
      target: { value: 'narrow' },
    });

    expect(screen.getByText('已自訂出版社版型，頁碼可能與參考稿不同。')).toBeInTheDocument();
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

    expect(screen.getByLabelText('內側邊界 (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('外側邊界 (cm)')).toBeInTheDocument();
    expect(screen.getByLabelText('裝訂預留 (cm)')).toBeInTheDocument();
  });
});
