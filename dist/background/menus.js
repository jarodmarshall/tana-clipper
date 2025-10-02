import { MESSAGE_TYPES } from '../common/messages.js';

export const MENU_IDS = {
  WITH_METADATA: 'tana-clipper/with-metadata',
  WITHOUT_METADATA: 'tana-clipper/without-metadata',
};

const MENU_CONTEXTS = ['selection', 'image', 'page', 'link'];

export function registerContextMenus() {
  chrome.contextMenus.removeAll(() => {
    logLastError('contextMenus.removeAll');

    chrome.contextMenus.create(
      {
        id: MENU_IDS.WITH_METADATA,
        title: 'Clip to Tana with metadata',
        contexts: MENU_CONTEXTS,
      },
      () => logLastError('contextMenus.create(with metadata)')
    );

    chrome.contextMenus.create(
      {
        id: MENU_IDS.WITHOUT_METADATA,
        title: 'Clip to Tana without metadata',
        contexts: MENU_CONTEXTS,
      },
      () => logLastError('contextMenus.create(without metadata)')
    );
  });
}

export function interpretContextMenuClick(info) {
  if (!info || typeof info.menuItemId !== 'string') {
    return null;
  }

  const includeMetadata = info.menuItemId === MENU_IDS.WITH_METADATA;
  const payload = {
    includeMetadata,
    context: reduceContextInfo(info),
  };

  return payload;
}

export function reduceContextInfo(info) {
  if (!info || typeof info !== 'object') return {};
  const payload = {};

  if (typeof info.selectionText === 'string' && info.selectionText.trim()) {
    payload.selectionText = info.selectionText;
  }

  if (typeof info.linkUrl === 'string' && info.linkUrl) {
    payload.linkUrl = info.linkUrl;
  }

  if (typeof info.srcUrl === 'string' && info.srcUrl) {
    payload.srcUrl = info.srcUrl;
  }

  if (typeof info.mediaType === 'string' && info.mediaType) {
    payload.mediaType = info.mediaType;
  }

  return payload;
}

export function logLastError(context) {
  if (chrome.runtime.lastError) {
    console.warn(`[Tana Clipper] ${context}:`, chrome.runtime.lastError.message);
  }
}
