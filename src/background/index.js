import { DEFAULT_CAPTURE_MODE, MESSAGE_TYPES, STORAGE_KEYS } from '../common/messages.js';
import { registerContextMenus, interpretContextMenuClick, logLastError } from './menus.js';
import { sendClipRequest, pushNotification } from './messaging.js';

chrome.runtime.onInstalled.addListener(() => {
  registerContextMenus();
  ensureDefaultPreferences();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || typeof tab.id !== 'number') return;
  const interpreted = interpretContextMenuClick(info);
  if (!interpreted) return;
  const captureMode = await getPreferredCaptureMode();

  try {
    const response = await sendClipRequest(tab.id, {
      includeMetadata: interpreted.includeMetadata,
      captureMode,
      context: interpreted.context,
    });

    if (!response?.ok) {
      throw new Error(response?.error || 'Clip request failed');
    }
  } catch (error) {
    console.error('[Tana Clipper] clip failed:', error);
    await pushNotification(tab.id, error.message || 'Unable to clip selection');
  }
});

function ensureDefaultPreferences() {
  chrome.storage.sync.get(STORAGE_KEYS.CAPTURE_MODE, (stored) => {
    if (chrome.runtime.lastError) {
      console.warn('[Tana Clipper] storage.sync.get failed:', chrome.runtime.lastError.message);
      return;
    }

    const current = stored?.[STORAGE_KEYS.CAPTURE_MODE];
    if (!current) {
      chrome.storage.sync.set(
        { [STORAGE_KEYS.CAPTURE_MODE]: DEFAULT_CAPTURE_MODE },
        () => logLastError('storage.sync.set(default captureMode)')
      );
    }
  });
}

function getPreferredCaptureMode() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(STORAGE_KEYS.CAPTURE_MODE, (stored) => {
      if (chrome.runtime.lastError) {
        console.warn('[Tana Clipper] storage.sync.get captureMode failed:', chrome.runtime.lastError.message);
        resolve(DEFAULT_CAPTURE_MODE);
        return;
      }

      const mode = stored?.[STORAGE_KEYS.CAPTURE_MODE];
      resolve(typeof mode === 'string' && mode ? mode : DEFAULT_CAPTURE_MODE);
    });
  });
}
