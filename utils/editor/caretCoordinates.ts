/**
 * BookPublisher MD2Docx
 * Copyright (c) 2025 EricHuang
 * Licensed under the MIT License.
 */

// Properties to copy from the textarea to the mirror div to ensure identical rendering
const properties = [
  'direction',
  'boxSizing',
  'width',
  'height',
  'overflowX',
  'overflowY',
  'borderTopWidth',
  'borderRightWidth',
  'borderBottomWidth',
  'borderLeftWidth',
  'borderStyle',
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontStyle',
  'fontVariant',
  'fontWeight',
  'fontStretch',
  'fontSize',
  'fontSizeAdjust',
  'lineHeight',
  'fontFamily',
  'textAlign',
  'textTransform',
  'textIndent',
  'textDecoration',
  'letterSpacing',
  'wordSpacing',
  'tabSize',
  'MozTabSize',
] as const;

export interface Coordinates {
  top: number;
  left: number;
  height: number;
}

/**
 * Calculates the coordinates (top, left, height) of the caret in a textarea.
 * 
 * @param element The textarea element
 * @param position The cursor position index (selectionStart)
 */
export function getCaretCoordinates(element: HTMLTextAreaElement, position: number): Coordinates {
  const isFirefox = (window as any).mozInnerScreenX != null;

  // Create a mirror div if it doesn't exist
  let div = document.getElementById('input-textarea-caret-position-mirror-div');
  if (!div) {
    div = document.createElement('div');
    div.id = 'input-textarea-caret-position-mirror-div';
    document.body.appendChild(div);
  }

  const style = div.style;
  const computed = window.getComputedStyle(element);
  const isInput = element.nodeName === 'INPUT';

  // Default styles for the mirror div to make it invisible but positioned correctly for calculation
  style.whiteSpace = 'pre-wrap';
  if (!isInput) style.wordWrap = 'break-word';

  // Position off-screen
  style.position = 'absolute';
  style.visibility = 'hidden';
  style.top = '-9999px';
  style.left = '-9999px';

  // Copy properties from textarea
  properties.forEach(prop => {
    if (isInput && prop === 'lineHeight') {
      if (computed.boxSizing === 'border-box') {
        const height = parseInt(computed.height);
        const outerHeight =
          parseInt(computed.paddingTop) +
          parseInt(computed.paddingBottom) +
          parseInt(computed.borderTopWidth) +
          parseInt(computed.borderBottomWidth);
        const targetHeight = outerHeight + parseInt(computed.lineHeight);

        if (height > targetHeight) {
          style.lineHeight = height - outerHeight + "px";
        } else if (height === targetHeight) {
          style.lineHeight = computed.lineHeight;
        } else {
          style.lineHeight = '0';
        }
      } else {
        style.lineHeight = computed.height;
      }
    } else {
      style[prop as any] = computed[prop];
    }
  });

  if (isFirefox) {
    if (element.scrollHeight > parseInt(computed.height))
      style.overflowY = 'scroll';
  } else {
    style.overflow = 'hidden';
  }

  div.textContent = element.value.substring(0, position);
  
  // Create a span to represent the caret
  const span = document.createElement('span');
  span.textContent = element.value.substring(position) || '.';
  div.appendChild(span);

  const coordinates = {
    top: span.offsetTop + parseInt(computed['borderTopWidth']),
    left: span.offsetLeft + parseInt(computed['borderLeftWidth']),
    height: parseInt(computed['lineHeight'])
  };
  
  // Clean up content but keep div for performance
  // div.remove(); // Optional: remove if you don't want to keep it in DOM
  
  return coordinates;
}
