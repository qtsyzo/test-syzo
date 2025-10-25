/* assets/scripts.js
   Shared JS: ambient audio toggle, whoosh audio, download confirmation modal behavior,
   and hooking .game-link anchors so nav/discord are unaffected.
   Place this file at assets/scripts.js and include from every page.
*/

(() => {
  // --- CONFIG: adjust if you host audio somewhere else ---
  const AMBIENT_SRC = 'assets/ambient.mp3'; // ambient loop file (host in repo)
  const WHOOSH_SRC  = 'assets/whoosh.mp3';  // whoosh confirmation sound (host in repo)
  const STORAGE_KEY = 'syzohalloween_sound';

  // Create and manage ambient audio element (shared across pages)
  let ambientAudio = document.getElementById('ambientAudioShared');
  if (!ambientAudio) {
    ambientAudio = document.createElement('audio');
    ambientAudio.id = 'ambientAudioShared';
    ambientAudio.loop = true;
    ambientAudio.preload = 'auto';
    ambientAudio.src = AMBIENT_SRC;
    document.body.appendChild(ambientAudio);
  }

  // whoosh audio element
  let whooshAudio = document.getElementById('whooshAudioShared');
  if (!whooshAudio) {
    whooshAudio = document.createElement('audio');
    whooshAudio.id = 'whooshAudioShared';
    whooshAudio.preload = 'auto';
    whooshAudio.src = WHOOSH_SRC;
    document.body.appendChild(whooshAudio);
  }

  // Audio toggle UI buttons are expected to have class .audio-toggle (multiple possible)
  function updateAudioButtons(on) {
    document.querySelectorAll('.audio-toggle').forEach(b => {
      b.textContent = on ? '🔊 Sound: On' : '🔈 Sound: Off';
      b.setAttribute('aria-pressed', String(on));
    });
  }

  // persisted state
  let audioOn = localStorage.getItem(STORAGE_KEY) === '1';
  function setAudio(on) {
    audioOn = !!on;
    localStorage.setItem(STORAGE_KEY, audioOn ? '1' : '0');
    if (audioOn) { ambientAudio.play().catch(()=>{}); } else { ambientAudio.pause(); ambientAudio.currentTime = 0; }
    updateAudioButtons(audioOn);
  }
  // init toggle buttons
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.classList && target.classList.contains('audio-toggle')) {
      setAudio(!audioOn);
    }
  });

  // initialize UI on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    updateAudioButtons(audioOn);
    if (audioOn) ambientAudio.play().catch(()=>{});
  });

  // --- Download confirmation modal logic ---
  // Build modal markup once, append to body
  let modal = document.getElementById('modalOverlayShared');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modalOverlayShared';
    modal.style.display = 'none';
    modal.innerHTML = `
      <div id="modalOverlay" aria-hidden="true" style="display:flex; align-items:center; justify-content:center; position:fixed; inset:0; z-index:1200;">
        <div class="confirm-wrap" role="dialog" aria-modal="true" aria-labelledby="confirmTitle" style="max-width:92%;">
          <div class="fog-portal" aria-hidden="true"></div>
          <div id="confirmTitle" class="confirm-title">Are you sure this is the correct file?</div>
          <div class="confirm-text">Click <strong>Yes</strong> to confirm and start the download, or <strong>No</strong> to cancel.</div>
          <div class="modal-actions">
            <button class="modal-btn yes">Yes</button>
            <button class="modal-btn no">No</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
    // style overlay to dim the rest of the screen
    modal.style.position = 'fixed';
    modal.style.inset = '0';
    modal.style.background = 'rgba(32,32,32,0.55)';
    modal.style.display = 'none';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '1200';
  }

  const YES_BTN = modal.querySelector('.modal-btn.yes');
  const NO_BTN  = modal.querySelector('.modal-btn.no');

  let pendingHref = null; // store the download URL clicked

  // clicking NO hides modal without redirect
  NO_BTN.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'none';
    pendingHref = null;
  });

  // clicking YES plays whoosh then redirects after 1s, hides modal
  YES_BTN.addEventListener('click', (e) => {
    e.preventDefault();
    if (!pendingHref) { modal.style.display = 'none'; return; }
    // play whoosh
    whooshAudio.currentTime = 0;
    whooshAudio.play().catch(()=>{});
    // quick swirl: fade overlay slightly then redirect
    setTimeout(() => {
      // redirect
      window.location.href = pendingHref;
      pendingHref = null;
    }, 1000); // 1 second delay as requested
  });

  // Hook up .game-link anchors to open confirmation modal instead of immediate nav.
  // Only hooks anchors with class 'game-link'. Leave nav/discord intact.
  function attachGameLinkInterceptors(scope) {
    const links = (scope || document).querySelectorAll('a.game-link');
    links.forEach(a => {
      // avoid attaching twice
      if (a.dataset.hook === '1') return;
      a.dataset.hook = '1';
      a.addEventListener('click', function(ev){
        // Only intercept left-click with no modifier keys
        if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        pendingHref = this.href;
        // open modal
        modal.style.display = 'flex';
      });
    });
  }

  // attach initially and also provide global function to re-run if DOM changes
  document.addEventListener('DOMContentLoaded', () => {
    attachGameLinkInterceptors(document);
  });

  // Expose helper for pages if they need to re-run the attachment after dynamic DOM updates
  window.SyzoHalloween = {
    attachGameLinkInterceptors
  };

})();
