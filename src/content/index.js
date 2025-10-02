import { MESSAGE_TYPES } from '../common/messages.js';

const CAPTURE_STRATEGIES = {
  selection: captureSelection,
  fullPage: () => ({ unsupported: 'Full page capture is planned for a future release.' }),
  bookmark: () => ({ unsupported: 'Bookmark capture is planned for a future release.' }),
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (!request || !request.type) return;

  if (request.type === MESSAGE_TYPES.CLIP) {
    handleClipMessage(request.payload || {}, sendResponse);
    return true;
  }

  if (request.type === MESSAGE_TYPES.NOTIFY) {
    const { message, isError } = request.payload || {};
    if (message) showToast(message, Boolean(isError));
  }
});

function handleClipMessage(payload, sendResponse) {
  (async () => {
    try {
      const includeMetadata = payload.includeMetadata !== false;
      const captureMode = typeof payload.captureMode === 'string' ? payload.captureMode : 'selection';
      const capture = resolveCapture(captureMode, payload.context || {});
      if (!capture.blocks.length && !capture.images.length) {
        throw new Error('Select some content before clipping.');
      }

      const metadata = collectPageMetadata();
      const tanaPaste = buildTanaPaste({ metadata, capture, includeMetadata });
      await copyToClipboard(tanaPaste);
      showToast('Copied Tana clip to clipboard.');
      sendResponse({ ok: true, length: tanaPaste.length });
    } catch (error) {
      const message = error && error.message ? error.message : 'Unable to build clip.';
      showToast(message, true);
      sendResponse({ ok: false, error: message });
    }
  })();
}

function resolveCapture(mode, context) {
  const strategy = CAPTURE_STRATEGIES[mode] || CAPTURE_STRATEGIES.selection;
  const result = strategy(context);
  if (result.unsupported) {
    throw new Error(result.unsupported);
  }
  result.blocks = Array.isArray(result.blocks) ? result.blocks : [];
  result.images = Array.isArray(result.images) ? result.images : [];
  return result;
}

function captureSelection(context = {}) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return captureFromContextFallback(context);
  }

  const range = selection.getRangeAt(0);
  const container = document.createElement('div');
  container.appendChild(range.cloneContents());

  const textBlocks = extractTextBlocks(container);
  const imageUrls = extractImageSources(container);

  return {
    blocks: dedupe(textBlocks.concat(contextSelectionText(context))),
    images: dedupe(imageUrls.concat(contextImageSources(context))),
  };
}

function captureFromContextFallback(context) {
  return {
    blocks: dedupe(contextSelectionText(context)),
    images: dedupe(contextImageSources(context)),
  };
}

function contextSelectionText(context = {}) {
  const lines = [];
  if (typeof context.selectionText === 'string') {
    const text = normaliseWhitespace(context.selectionText);
    if (text) lines.push(text);
  }

  if (typeof context.linkUrl === 'string' && context.linkUrl) {
    const linkUrl = resolveUrl(context.linkUrl);
    const selectionLabel =
      typeof context.selectionText === 'string' ? normaliseWhitespace(context.selectionText) : '';
    const label = selectionLabel || linkUrl;
    lines.push(`[${label}](${linkUrl})`);
  }

  return lines;
}

function contextImageSources(context = {}) {
  if (typeof context.srcUrl === 'string' && context.srcUrl) {
    return [resolveUrl(context.srcUrl)];
  }
  return [];
}

function extractTextBlocks(root) {
  const blocks = [];
  const blockSelectors = 'p,li,blockquote,pre,h1,h2,h3,h4,h5,h6';
  root.querySelectorAll(blockSelectors).forEach((node) => {
    const text = normaliseWhitespace(node.textContent);
    if (text) blocks.push(text);
  });

  if (!blocks.length) {
    const fallback = normaliseWhitespace(root.textContent);
    if (fallback) {
      fallback
        .split(/\n{2,}/)
        .map((chunk) => normaliseWhitespace(chunk))
        .forEach((chunk) => {
          if (chunk) blocks.push(chunk);
        });
    }
  }

  return blocks;
}

function extractImageSources(root) {
  return Array.from(root.querySelectorAll('img'))
    .map((img) => img.getAttribute('src') || img.getAttribute('data-src') || '')
    .map((src) => resolveUrl(src))
    .filter((src) => Boolean(src));
}

function collectPageMetadata() {
  const doc = document;
  const title = normaliseWhitespace(doc.title) || 'Untitled clip';
  const url = window.location.href;
  const author = firstNonEmpty([
    getMetaContent('meta[name="author"]'),
    getMetaContent('meta[property="article:author"]'),
    getMetaContent('meta[name="byl"]'),
  ]);
  const rawDate = firstNonEmpty([
    getMetaContent('meta[property="article:published_time"]'),
    getMetaContent('meta[name="date"]'),
    getMetaContent('meta[name="pubdate"]'),
    getMetaContent('meta[name="publish-date"]'),
  ]);

  return {
    title,
    url,
    author,
    date: formatDate(rawDate),
  };
}

function buildTanaPaste({ metadata, capture, includeMetadata }) {
  const indent = '  ';
  const lines = ['%%tana%%', `- ${metadata.title}`];

  if (includeMetadata) {
    lines.push(`${indent}- Source URL:: ${metadata.url}`);
    if (metadata.author) lines.push(`${indent}- Author:: ${metadata.author}`);
    if (metadata.date) lines.push(`${indent}- Date:: ${metadata.date}`);
  }

  capture.blocks.forEach((block) => {
    lines.push(`${indent}- ${block}`);
  });

  capture.images.forEach((src) => {
    lines.push(`${indent}- ![](${src})`);
  });

  return lines.join('\n');
}

async function copyToClipboard(text) {
  if (!text) throw new Error('Nothing to copy.');

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (_error) {
      // Fall back to execCommand path below.
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('aria-hidden', 'true');
  textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;';
  const host = document.body || document.documentElement;
  host.appendChild(textarea);
  textarea.select();
  const successful = document.execCommand('copy');
  if (textarea.parentNode) textarea.parentNode.removeChild(textarea);
  if (!successful) {
    throw new Error('Clipboard copy was blocked.');
  }
}

function showToast(message, isError = false) {
  let toast = document.getElementById('tana-clipper-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tana-clipper-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'right:20px',
      'max-width:260px',
      'padding:10px 14px',
      'border-radius:6px',
      'font-family:Arial,sans-serif',
      'font-size:13px',
      'line-height:1.4',
      'box-shadow:0 2px 12px rgba(0,0,0,0.25)',
      'color:#fff',
      'background:#2c7be5',
      'opacity:0',
      'transition:opacity 0.2s ease-in-out',
      'z-index:2147483647',
    ].join(';');
    (document.body || document.documentElement).appendChild(toast);
  }

  toast.style.background = isError ? '#d9534f' : '#2c7be5';
  toast.textContent = message;
  toast.style.opacity = '1';

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
    }, 200);
  }, 2400);
}

function getMetaContent(selector) {
  const node = document.querySelector(selector);
  return node && node.content ? node.content.trim() : '';
}

function firstNonEmpty(values) {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0) || '';
}

function formatDate(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }
  const isoMatch = value.match(/\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];
  return value;
}

function normaliseWhitespace(value) {
  return value ? value.replace(/\s+/g, ' ').trim() : '';
}

function resolveUrl(possibleUrl) {
  if (!possibleUrl) return '';
  try {
    return new URL(possibleUrl, window.location.href).toString();
  } catch (_error) {
    return possibleUrl;
  }
}

function dedupe(items) {
  return Array.from(new Set(items.filter(Boolean)));
}
