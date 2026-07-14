// Content script — injects a floating "Capture to Backup" button
// when the user hovers over download links on any page.

(function () {
  let hostEl: HTMLDivElement | null = null;

  function createFloatingBtn(link: HTMLAnchorElement, x: number, y: number) {
    removeBtn();

    hostEl = document.createElement('div');
    const shadow = hostEl.attachShadow({ mode: 'closed' });

    shadow.innerHTML = `
      <style>
        button {
          position: fixed;
          z-index: 2147483647;
          padding: 6px 12px;
          background: #4f8cff;
          color: #fff;
          border: none;
          border-radius: 8px;
          font: 600 12px/1 system-ui, sans-serif;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,.3);
          transition: background 120ms;
          left: ${x + 8}px;
          top: ${y - 32}px;
        }
        button:hover { background: #3d7df5; }
      </style>
      <button>Capture to Backup Cloud</button>
    `;

    const btn = shadow.querySelector('button')!;
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage(
        {
          type: 'CONTENT_CAPTURE',
          data: {
            url: link.href,
            filename: link.download || link.textContent?.trim() || link.href.split('/').pop() || 'unknown',
            fileSize: 0,
            hash: null,
          },
        },
        (res) => {
          if (chrome.runtime.lastError) {
            console.error('Capture send failed:', chrome.runtime.lastError.message);
            return;
          }
          if (res?.ok) {
            showToast(res.duplicate ? 'Duplicate detected — storage saved!' : 'File captured for backup');
          }
        }
      );
      removeBtn();
    });

    document.body.appendChild(hostEl);
  }

  function removeBtn() {
    hostEl?.remove();
    hostEl = null;
  }

  function showToast(msg: string) {
    const toast = document.createElement('div');
    const shadow = toast.attachShadow({ mode: 'closed' });
    shadow.innerHTML = `
      <style>
        div {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2147483647;
          background: #14161a;
          color: rgba(255,255,255,0.92);
          padding: 10px 18px;
          border-radius: 12px;
          font: 13px/1.4 system-ui, sans-serif;
          box-shadow: 0 4px 20px rgba(0,0,0,.4);
          border: 1px solid rgba(255,255,255,0.08);
          animation: toast-in 200ms cubic-bezier(0.16,1,0.3,1);
        }
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      </style>
      <div>${msg}</div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // Hover detection on links that look like downloads
  document.addEventListener('mouseover', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (!link?.href) return;

    // Only show for file-like links (download attribute, or file extension URLs)
    const hasDownload = link.hasAttribute('download');
    const hasFileExt = /\.(pdf|zip|docx?|xlsx?|pptx?|mp4|mov|mp3|png|jpe?g|gif|svg|heic|dmg|exe|apk|iso|tar|gz|7z|rar|txt|csv|json|xml|html|js|ts|py|java|rb|go|rs)(\?|$)/i.test(link.href);
    const isExternal = link.hostname && link.hostname !== location.hostname;

    if (!hasDownload && !hasFileExt && !isExternal) return;

    const rect = link.getBoundingClientRect();
    createFloatingBtn(link, rect.left, rect.top);
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a');
    if (link && hostEl) {
      // Delay removal to allow clicking the button
      setTimeout(() => {
        const btnInShadow = hostEl?.shadowRoot?.querySelector('button');
        if (btnInShadow && !btnInShadow.matches(':hover')) {
          removeBtn();
        }
      }, 150);
    }
  });

  document.addEventListener('mousedown', (e) => {
    if (hostEl && e.target !== hostEl && !hostEl.contains(e.target as Node)) {
      removeBtn();
    }
  });
})();
