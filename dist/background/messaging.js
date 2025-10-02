import { MESSAGE_TYPES } from '../common/messages.js';

export async function sendClipRequest(tabId, payload) {
  try {
    return await sendMessage(tabId, { type: MESSAGE_TYPES.CLIP, payload });
  } catch (error) {
    if (shouldRetryWithInjection(error)) {
      await injectContentScript(tabId);
      return sendMessage(tabId, { type: MESSAGE_TYPES.CLIP, payload });
    }
    throw error;
  }
}

export async function pushNotification(tabId, message) {
  try {
    await sendMessage(tabId, {
      type: MESSAGE_TYPES.NOTIFY,
      payload: { message, isError: true },
    });
  } catch (error) {
    console.warn('[Tana Clipper] could not push notification:', error.message);
  }
}

function sendMessage(tabId, message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}

function shouldRetryWithInjection(error) {
  if (!error || !error.message) return false;
  return (
    error.message.includes('Could not establish connection') ||
    error.message.includes('Receiving end does not exist')
  );
}

function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript(
      {
        target: { tabId },
        files: ['src/content/index.js'],
      },
      (results) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(results);
      }
    );
  });
}
