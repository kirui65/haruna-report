(function () {
  const pageTarget = document.querySelector('aside') || document.querySelector('main');
  if (!pageTarget) return;

  const ads = [
    { key: '17ef4cfafefe417f0b6322d66595dbfa', width: 160, height: 300 },
    { key: 'a54257eb4272e122d5a73de8f9e1131c', width: 320, height: 50 },
    { key: '6c10481f43f1b4a3ddc9e4e0ff15aa90', width: 468, height: 60 }
  ];

  function makeSlot(ad) {
    const slot = document.createElement('div');
    slot.className = 'haruna-ad-slot';
    slot.setAttribute('aria-label', 'Advertisement');
    Object.assign(slot.style, {
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: `${ad.height + 20}px`,
      margin: '18px 0', padding: '10px', background: '#fff',
      border: '1px solid #dedbd2', borderRadius: '10px', overflow: 'hidden'
    });
    const label = document.createElement('div');
    label.textContent = 'Advertisement';
    Object.assign(label.style, {
      color: '#69716b', font: '700 10px/1 system-ui,sans-serif',
      letterSpacing: '.12em', marginBottom: '8px', textTransform: 'uppercase'
    });
    slot.appendChild(label);
    return slot;
  }

  const slots = ads.map(makeSlot);
  const nativeSlot = document.createElement('div');
  nativeSlot.className = 'haruna-ad-slot';
  nativeSlot.setAttribute('aria-label', 'Advertisement');
  nativeSlot.innerHTML = '<div style="color:#69716b;font:700 10px/1 system-ui,sans-serif;letter-spacing:.12em;margin-bottom:8px;text-transform:uppercase">Advertisement</div><div id="container-fc4160c16d4a43f624def27925a77f87"></div>';
  Object.assign(nativeSlot.style, {
    margin: '18px 0', padding: '10px', background: '#fff',
    border: '1px solid #dedbd2', borderRadius: '10px', overflow: 'hidden'
  });
  const nativeScript = document.createElement('script');
  nativeScript.async = true;
  nativeScript.setAttribute('data-cfasync', 'false');
  nativeScript.src = 'https://bicea.org/21/fc4160c16d4a43f624def27925a77f87';
  nativeSlot.appendChild(nativeScript);
  const smartSlot = document.createElement('div');
  smartSlot.className = 'haruna-ad-slot';
  smartSlot.setAttribute('aria-label', 'Sponsored link');
  smartSlot.innerHTML = '<a href="https://arwf.org/4/703e401c8fa80147ef137175dcad8919" target="_blank" rel="sponsored noopener" style="color:#08733f;font:700 12px system-ui,sans-serif;text-decoration:none">Sponsored</a>';
  Object.assign(smartSlot.style, {
    display: 'flex', justifyContent: 'center', padding: '10px',
    margin: '18px 0', background: '#fff', border: '1px solid #dedbd2', borderRadius: '10px'
  });
  if (pageTarget.tagName === 'ASIDE') {
    slots.reverse().forEach(slot => pageTarget.prepend(slot));
    pageTarget.prepend(nativeSlot);
    pageTarget.prepend(smartSlot);
  } else {
    const actions = pageTarget.querySelector('.actions');
    if (actions) {
      slots.forEach(slot => actions.after(slot));
      actions.after(nativeSlot);
      actions.after(smartSlot);
    } else {
      pageTarget.append(smartSlot, nativeSlot, ...slots);
    }
  }

  // Load units in order because the provider reads the global atOptions object.
  function load(index) {
    const ad = ads[index];
    if (!ad) return;
    window.atOptions = { key: ad.key, format: 'iframe', height: ad.height, width: ad.width, params: {} };
    const script = document.createElement('script');
    script.src = `https://bicea.org/22/${ad.key}`;
    script.onload = () => load(index + 1);
    slots[index].appendChild(script);
  }
  load(0);

  // Popunder provider code supplied by the site owner; loaded once per page.
  const popunder = document.createElement('script');
  popunder.setAttribute('data-cfasync', 'false');
  popunder.src = 'https://afders.org/1/698f51e4ab761a368ec9b069a0c8acc8';
  document.head.appendChild(popunder);

  const socialbar = document.createElement('script');
  socialbar.setAttribute('data-cfasync', 'false');
  socialbar.src = 'https://bicea.org/14/4527eae75e9e3b8d3fd7a0d59138c618';
  document.head.appendChild(socialbar);
})();
