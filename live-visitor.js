/* Live Visitor Constellation – no-backend demo
   ---------------------------------------------
   • Every tab acts as a ‘client’ with a random id.
   • Presence & nav hover are broadcast via localStorage events so multiple tabs simulate remote users.
   • Real deployment can swap sendPresence()/onPresence() with a WebSocket/Ably channel.
*/
(() => {
  // Feature flag – only run when ?live flag present or #live-demo route
  const enabled = /[?&]live(=1)?/i.test(location.search) || /live-demo/i.test(location.hash);
  if (!enabled) return;

  // Canvas setup -----------------------------------------------------------
  const canvas = document.createElement('canvas');
  canvas.id = 'liveCanvas';
  Object.assign(canvas.style, {
    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
    pointerEvents: 'none', zIndex: 9999
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  // Handle resize
  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  window.addEventListener('resize', resize); resize();

  // Visitor state ----------------------------------------------------------
  const id = crypto.randomUUID();
  const colorSelf = '#ffa500'; // orange self
  const colorOther = '#0f0';   // green others
  let myState = { id, x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight, nav: '', ts: Date.now() };
  const others = new Map(); // id -> state

  // Broadcast helpers ------------------------------------------------------
  function sendPresence() {
    localStorage.setItem('visitor-presence', JSON.stringify(myState));
    // cleanup key to avoid quota growth
    setTimeout(()=> localStorage.removeItem('visitor-presence'), 0);
  }

  // Listen for other visitors
  window.addEventListener('storage', (e) => {
    if (e.key !== 'visitor-presence' || !e.newValue) return;
    try {
      const data = JSON.parse(e.newValue);
      if (!data.id || data.id === id) return;
      others.set(data.id, data);
    } catch(_){ /* noop */ }
  });

  // Nav hover mapping ------------------------------------------------------
  document.querySelectorAll('.nav a').forEach(a => {
    a.addEventListener('mouseenter', () => {
      myState.nav = a.getAttribute('href');
      sendPresence();
    });
    a.addEventListener('mouseleave', () => {
      myState.nav = '';
      sendPresence();
    });
  });

  // Periodic self broadcast and position wander for fun
  setInterval(() => {
    // gentle wander
    myState.x += (Math.random()-0.5)*10;
    myState.y += (Math.random()-0.5)*10;
    // keep on screen
    myState.x = Math.max(0, Math.min(window.innerWidth, myState.x));
    myState.y = Math.max(0, Math.min(window.innerHeight, myState.y));
    myState.ts = Date.now();
    sendPresence();
  }, 5000);
  sendPresence(); // initial

  // Render loop ------------------------------------------------------------
  function draw() {
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // Draw others
    const now = Date.now();
    others.forEach((v, key) => {
      // purge stale >12s
      if (now - v.ts > 12000) { others.delete(key); return; }
      // connect if same nav
      if (v.nav && v.nav === myState.nav && v.nav !== '') {
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(myState.x, myState.y);
        ctx.lineTo(v.x, v.y);
        ctx.stroke();
      }
      ctx.fillStyle = colorOther;
      ctx.beginPath();
      ctx.arc(v.x, v.y, 4, 0, Math.PI*2);
      ctx.fill();
    });

    // draw self last
    ctx.fillStyle = colorSelf;
    ctx.beginPath();
    ctx.arc(myState.x, myState.y, 6, 0, Math.PI*2);
    ctx.fill();

    requestAnimationFrame(draw);
  }
  draw();
})();