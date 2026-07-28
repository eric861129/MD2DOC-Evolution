import { OnOffElement, XmlComponent } from 'docx';
import type { ResolvedPageLayout } from './layout/types';

const DISPLAY_BACKGROUND_SHAPE_KEY = 'w:displayBackgroundShape';

/**
 * 透過 docx 的 XmlComponent 擴充點，在既有 Settings 元件樹的合法位置插入設定。
 */
class SettingsXmlAccessor extends XmlComponent {
  private constructor() {
    super('w:settings');
  }

  public static insertAfter(
    settings: XmlComponent,
    anchorRootKey: string,
    child: XmlComponent,
  ): void {
    const settingsAccessor = settings as SettingsXmlAccessor;
    const anchorIndex = settingsAccessor.root.findIndex(
      (candidate) => SettingsXmlAccessor.getRootKey(candidate) === anchorRootKey,
    );
    if (anchorIndex < 0) {
      throw new Error(`DOCX 設定缺少必要節點：${anchorRootKey}`);
    }

    settingsAccessor.root.splice(anchorIndex + 1, 0, child);
  }

  private static getRootKey(component: unknown): string | undefined {
    return component instanceof XmlComponent
      ? (component as SettingsXmlAccessor).rootKey
      : undefined;
  }
}

/** 依解析後的版面設定加入符合 CT_Settings 順序的頁面選項。 */
export const applyPageSettings = (
  settings: XmlComponent,
  layout: ResolvedPageLayout,
): void => {
  const setting = layout.margins.mode === 'mirrored'
    ? new OnOffElement('w:mirrorMargins', true)
    : layout.margins.gutterPosition === 'top'
      ? new OnOffElement('w:gutterAtTop', true)
      : undefined;

  if (setting) {
    SettingsXmlAccessor.insertAfter(
      settings,
      DISPLAY_BACKGROUND_SHAPE_KEY,
      setting,
    );
  }
};
