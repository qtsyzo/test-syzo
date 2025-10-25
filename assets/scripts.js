// Shared Halloween JS: ambient audio, fog confirmation modal, download interceptors, and sound toggle.
(() => {
  const STORAGE_KEY = 'syzohalloween_sound';
  const AMBIENT_SRC = 'assets/coast-162.mp3'; // background loop file
  const WHOOSH_SRC  = 'assets/whoosh.mp3';    // optional whoosh for modal

  // Ambient audio element
  let ambient = document.getElementById('ambientAudioShared');
  if(!ambient){
    ambient = document.createElement('audio');
    ambient.id = 'ambientAudioShared';
    ambient.loop = true;
    ambient.preload = 'auto';
    ambient.src = AMBIENT_SRC;
    document.body.appendChild(ambient);
  }

  // Optional whoosh
  let whoosh = document.getElementById('whooshAudioShared');
  if(!whoosh){
    whoosh = document.createElement('audio');
    whoosh.id = 'whooshAudioShared';
    whoosh.preload = 'auto';
    whoosh.src = WHOOSH_SRC;
    document.body.appendChild(whoosh);
  }

  // Bottom-right sound button
  if(!document.querySelector('.sound-btn')){
    const btn = document.createElement('button');
    btn.className = 'sound-btn';
    btn.setAttribute('aria-pressed','false');
    document.body.appendChild(btn);
  }
  const soundBtn = document.querySelector('.sound-btn');

  function updateBtn(on){
    soundBtn.textContent = on ? '🔊' : '🔇';
    soundBtn.setAttribute('aria-pressed', String(on));
  }

  let audioOn = localStorage.getItem(STORAGE_KEY) === '1';
  function setAudio(on){
    audioOn = !!on;
    localStorage.setItem(STORAGE_KEY, audioOn ? '1' : '0');
    updateBtn(audioOn);
    if(audioOn){
      ambient.play().catch(()=>{});
    } else {
      ambient.pause();
      try{ ambient.currentTime = 0; }catch(e){}
    }
  }
  soundBtn.addEventListener('click', ()=> setAudio(!audioOn));

  document.addEventListener('DOMContentLoaded', ()=>{
    updateBtn(audioOn);
    if(audioOn) ambient.play().catch(()=>{});
  });

  // Build confirmation modal once
  let modal = document.getElementById('modalOverlay');
  if(!modal){
    modal = document.createElement('div');
    modal.id = 'modalOverlay';
    modal.innerHTML = `
      <div class="confirm-wrap" role="dialog" aria-modal="true" aria-labelledby="confirmTitle">
        <div class="fog-portal" aria-hidden="true"></div>
        <div id="confirmTitle" class="confirm-title">Are you sure this is the correct file?</div>
        <div class="confirm-text">Click <strong>Yes</strong> to confirm and start the download, or <strong>No</strong> to cancel.</div>
        <div class="modal-actions">
          <button class="modal-btn yes">Yes</button>
          <button class="modal-btn no">No</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }

  const yesBtn = modal.querySelector('.modal-btn.yes');
  const noBtn  = modal.querySelector('.modal-btn.no');
  let pendingHref = null;

  noBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    modal.style.display = 'none';
    pendingHref = null;
  });

  yesBtn.addEventListener('click', (e)=>{
    e.preventDefault();
    if(!pendingHref){ modal.style.display = 'none'; return; }
    whoosh && whoosh.play && whoosh.play().catch(()=>{});
    setTimeout(()=>{
      window.location.href = pendingHref;
      pendingHref = null;
      modal.style.display = 'none';
    }, 1000);
  });

  function attachInterceptors(scope){
    const links = (scope || document).querySelectorAll('a.game-link');
    links.forEach(a=>{
      if(a.dataset.hook === '1') return;
      a.dataset.hook = '1';
      a.addEventListener('click', function(ev){
        if (ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
        ev.preventDefault();
        pendingHref = this.href;
        modal.style.display = 'flex';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', ()=> attachInterceptors(document));
  window.SyzoHalloween = { attachInterceptors };
})();
