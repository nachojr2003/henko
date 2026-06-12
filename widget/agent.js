(function () {
  'use strict';

  /* ── CONFIG ─────────────────────────────────────────────────────────── */
  var cfg = Object.assign({
    n8nBase:        'https://n8n-jcg4epwgyztosnmbxghhwvdv.34.133.34.116.sslip.io',
    webhookPath:    '/webhook/henko-agent',
    leadsPath:      '/webhook/henko-leads',
    timeoutMs:      35000,
    maxRetries:     2,
    sessionTtlMs:   30 * 60 * 1000,
    primaryColor:   '#1B6B2D',
    secondaryColor: '#F5C300',
    agentName:      'Henko Advisor',
    agentSubtitle:  'Asistente de Corporación Henko',
    welcomeMessage: 'Hola, soy el asistente virtual de Corporación Henko. Cuéntame qué estás buscando: ¿quieres comprar un lote para vivir, invertir o tener tu casa de campo?',
    privacyUrl:     '/politica-privacidad.html',
    poweredByUrl:   'https://ijvagency.com/',
    whatsappUrl:    'https://wa.me/51932846404'
  }, window.henkoAgentConfig || {});

  /* ── SESSION ─────────────────────────────────────────────────────────── */
  var SESSION_KEY   = 'henko_session_id';
  var LAST_KEY      = 'henko_session_last';
  var MSGS_KEY      = 'henko_msgs';

  function getSessionId() {
    var now = Date.now();
    var last = parseInt(sessionStorage.getItem(LAST_KEY) || '0', 10);
    if (now - last > cfg.sessionTtlMs) {
      var id = 'web_' + now + '_' + Math.random().toString(36).slice(2, 9);
      sessionStorage.setItem(SESSION_KEY, id);
      sessionStorage.removeItem(MSGS_KEY);
    }
    sessionStorage.setItem(LAST_KEY, String(now));
    return sessionStorage.getItem(SESSION_KEY) || 'default';
  }

  function saveMsgs(msgs) {
    try { sessionStorage.setItem(MSGS_KEY, JSON.stringify(msgs.slice(-40))); } catch (e) {}
  }
  function loadMsgs() {
    try { return JSON.parse(sessionStorage.getItem(MSGS_KEY) || '[]'); } catch (e) { return []; }
  }

  /* ── STYLES ──────────────────────────────────────────────────────────── */
  var css = [
    '.hk-widget-btn{position:fixed;bottom:24px;right:24px;width:60px;height:60px;border-radius:50%;',
    'background:' + cfg.primaryColor + ';border:none;cursor:pointer;box-shadow:0 4px 16px rgba(0,0,0,.28);',
    'display:flex;align-items:center;justify-content:center;z-index:9998;transition:transform .2s;}',
    '.hk-widget-btn:hover{transform:scale(1.08);}',
    '.hk-widget-btn svg{pointer-events:none;}',
    '.hk-widget-window{position:fixed;bottom:96px;right:24px;width:360px;max-width:calc(100vw - 32px);',
    'height:560px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;',
    'box-shadow:0 8px 32px rgba(0,0,0,.22);display:flex;flex-direction:column;z-index:9999;',
    'overflow:hidden;opacity:0;transform:translateY(12px);transition:opacity .22s,transform .22s;pointer-events:none;}',
    '.hk-widget-window.hk-open{opacity:1;transform:translateY(0);pointer-events:all;}',
    '.hk-header{background:' + cfg.primaryColor + ';padding:14px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;}',
    '.hk-header-avatar{width:38px;height:38px;border-radius:50%;background:#fff;display:flex;align-items:center;',
    'justify-content:center;flex-shrink:0;overflow:hidden;}',
    '.hk-header-avatar img{width:32px;height:32px;object-fit:contain;}',
    '.hk-header-info{flex:1;min-width:0;}',
    '.hk-header-name{color:#fff;font-weight:700;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.hk-header-sub{color:rgba(255,255,255,.82);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
    '.hk-header-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.8);',
    'padding:4px;border-radius:6px;display:flex;align-items:center;justify-content:center;transition:color .15s;}',
    '.hk-header-close:hover{color:#fff;}',
    '.hk-messages{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:10px;}',
    '.hk-msg{max-width:82%;border-radius:12px;padding:10px 13px;font-size:14px;line-height:1.5;word-break:break-word;}',
    '.hk-msg-user{align-self:flex-end;background:' + cfg.primaryColor + ';color:#fff;border-bottom-right-radius:4px;}',
    '.hk-msg-bot{align-self:flex-start;background:#f2f2f2;color:#1a1a1a;border-bottom-left-radius:4px;}',
    '.hk-msg-bot img{max-width:1.2em!important;max-height:1.2em!important;display:inline-block!important;',
    'vertical-align:text-bottom!important;}',
    '.hk-msg strong,.hk-msg b{font-weight:600;}',
    '.hk-msg ul,.hk-msg ol{margin:6px 0;padding-left:18px;}',
    '.hk-msg li{margin-bottom:3px;}',
    '.hk-msg p{margin:0 0 6px;}',
    '.hk-msg p:last-child{margin:0;}',
    '.hk-typing{display:flex;gap:5px;align-items:center;align-self:flex-start;padding:10px 14px;',
    'background:#f2f2f2;border-radius:12px;border-bottom-left-radius:4px;}',
    '.hk-typing span{width:7px;height:7px;background:#aaa;border-radius:50%;',
    'animation:hk-bounce .9s infinite ease-in-out;display:block;}',
    '.hk-typing span:nth-child(2){animation-delay:.18s;}',
    '.hk-typing span:nth-child(3){animation-delay:.36s;}',
    '@keyframes hk-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',
    '.hk-input-row{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #eee;flex-shrink:0;align-items:flex-end;}',
    '.hk-input{flex:1;border:1.5px solid #ddd;border-radius:10px;padding:9px 12px;font-size:14px;',
    'resize:none;outline:none;font-family:inherit;max-height:100px;overflow-y:auto;line-height:1.4;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;}',
    '.hk-input:focus{border-color:' + cfg.primaryColor + ';}',
    '.hk-send-btn{width:38px;height:38px;border-radius:50%;background:' + cfg.primaryColor + ';border:none;',
    'cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s;}',
    '.hk-send-btn:disabled{opacity:.45;cursor:default;}',
    '.hk-send-btn svg{pointer-events:none;}',
    '.hk-footer{padding:6px 12px 10px;text-align:center;font-size:11px;color:#aaa;flex-shrink:0;',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}',
    '.hk-footer a{color:#aaa;text-decoration:none;}.hk-footer a:hover{color:' + cfg.primaryColor + ';}',
    '.hk-footer .sep{margin:0 5px;}',
    /* lead form */
    '.hk-lead-form{background:#fff;border:1.5px solid #e0e0e0;border-radius:12px;padding:14px;',
    'margin:4px 0;font-size:13px;}',
    '.hk-lead-form h4{margin:0 0 10px;font-size:14px;color:' + cfg.primaryColor + ';}',
    '.hk-lead-form label{display:block;font-size:12px;color:#666;margin-bottom:3px;}',
    '.hk-lead-form input,.hk-lead-form select{width:100%;box-sizing:border-box;border:1.5px solid #ddd;',
    'border-radius:8px;padding:8px 10px;font-size:13px;margin-bottom:9px;font-family:inherit;outline:none;}',
    '.hk-lead-form input:focus,.hk-lead-form select:focus{border-color:' + cfg.primaryColor + ';}',
    '.hk-lead-form-submit{width:100%;padding:10px;background:' + cfg.primaryColor + ';color:#fff;',
    'border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s;}',
    '.hk-lead-form-submit:hover{opacity:.88;}',
    '.hk-lead-form-submit:disabled{opacity:.45;}',
    '.hk-lead-note{font-size:11px;color:#aaa;margin-top:4px;text-align:center;}',
    /* form open button */
    '.hk-form-open-btn{display:flex;align-items:center;justify-content:center;gap:6px;',
    'background:' + cfg.secondaryColor + ';color:' + cfg.primaryColor + ';border:none;border-radius:8px;',
    'padding:10px 16px;font-size:14px;font-weight:700;cursor:pointer;width:100%;',
    'transition:opacity .15s;margin-top:6px;}',
    '.hk-form-open-btn:hover{opacity:.88;}',
    '.hk-form-open-btn svg{pointer-events:none;flex-shrink:0;}',
    /* whatsapp cta */
    '.hk-wsp-cta{display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;',
    'border-radius:10px;padding:10px 14px;font-size:13px;font-weight:600;text-decoration:none;',
    'margin:6px 0;justify-content:center;}',
    '.hk-wsp-cta:hover{opacity:.88;}',
    '@media(max-width:400px){.hk-widget-window{right:8px;left:8px;width:auto;border-radius:12px;}}',
  ].join('');

  var style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  /* ── BUILD DOM ───────────────────────────────────────────────────────── */
  var btn = document.createElement('button');
  btn.className = 'hk-widget-btn';
  btn.setAttribute('aria-label', 'Abrir chat Henko');
  btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  var win = document.createElement('div');
  win.className = 'hk-widget-window';
  win.setAttribute('role', 'dialog');
  win.setAttribute('aria-label', 'Chat Henko');

  var logoSrc = 'https://cdn.jsdelivr.net/gh/nachojr2003/henko@main/henko%20logo.jpg';

  win.innerHTML = [
    '<div class="hk-header">',
    '  <div class="hk-header-avatar">',
    '    <img src="' + logoSrc + '" alt="Henko" onerror="this.style.display=\'none\'">',
    '  </div>',
    '  <div class="hk-header-info">',
    '    <div class="hk-header-name">' + esc(cfg.agentName) + '</div>',
    '    <div class="hk-header-sub">' + esc(cfg.agentSubtitle) + '</div>',
    '  </div>',
    '  <button class="hk-header-close" aria-label="Cerrar chat">',
    '    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    '  </button>',
    '</div>',
    '<div class="hk-messages" id="hk-msgs"></div>',
    '<div class="hk-input-row">',
    '  <textarea class="hk-input" id="hk-input" rows="1" placeholder="Escribe tu mensaje..." aria-label="Mensaje"></textarea>',
    '  <button class="hk-send-btn" id="hk-send" aria-label="Enviar">',
    '    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>',
    '  </button>',
    '</div>',
    '<div class="hk-footer">',
    '  <a href="' + esc(cfg.privacyUrl) + '" target="_blank">Política de privacidad</a>',
    '  <span class="sep">·</span>',
    '  <a href="' + esc(cfg.poweredByUrl) + '" target="_blank" rel="noopener">Powered by IJV</a>',
    '</div>',
  ].join('');

  document.body.appendChild(btn);
  document.body.appendChild(win);

  /* ── REFS ────────────────────────────────────────────────────────────── */
  var $msgs   = win.querySelector('#hk-msgs');
  var $input  = win.querySelector('#hk-input');
  var $send   = win.querySelector('#hk-send');
  var $close  = win.querySelector('.hk-header-close');

  var isOpen    = false;
  var isBusy    = false;
  var messages  = loadMsgs();
  var welcomed  = false;

  /* ── HELPERS ─────────────────────────────────────────────────────────── */
  function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function md(text) {
    return String(text || '')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      .replace(/\n\n+/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/^(.+)$/, '<p>$1</p>');
  }

  function scrollToBottom() {
    $msgs.scrollTop = $msgs.scrollHeight;
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(function () { $msgs.scrollTop = $msgs.scrollHeight; });
    }
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'hk-typing';
    el.id = 'hk-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    $msgs.appendChild(el);
    scrollToBottom();
    return el;
  }
  function hideTyping() {
    var el = document.getElementById('hk-typing');
    if (el) el.remove();
  }

  /* ── TYPEWRITER ──────────────────────────────────────────────────────── */
  var TW_WORD_MS  = 22;   // ms entre palabras
  var TW_PAUSE_MS = 90;   // ms extra después de . ? !

  function typewriteBot(rawText, el, onDone) {
    var tokens = rawText.match(/[^\s]+|\s+/g) || [''];
    var i = 0;
    var built = '';

    function step() {
      if (i >= tokens.length) {
        el.innerHTML = md(built);
        scrollToBottom();
        if (onDone) onDone();
        return;
      }
      built += tokens[i++];
      el.innerHTML = md(built);
      scrollToBottom();
      var last = built.replace(/\s+$/, '').slice(-1);
      setTimeout(step, /[.!?]/.test(last) ? TW_PAUSE_MS : TW_WORD_MS);
    }
    step();
  }

  /* Crea burbuja bot, typewritea y guarda. Usar para mensajes nuevos. */
  function pushBotTypewritten(text, onDone) {
    var el = document.createElement('div');
    el.className = 'hk-msg hk-msg-bot';
    $msgs.appendChild(el);
    scrollToBottom();
    messages.push({ role: 'bot', text: text });
    saveMsgs(messages);
    typewriteBot(text, el, onDone);
    return el;
  }

  /* pushMsg instant — para mensajes de usuario y para renderSaved. */
  function pushMsg(role, text, opts) {
    opts = opts || {};
    var el = document.createElement('div');
    el.className = 'hk-msg ' + (role === 'user' ? 'hk-msg-user' : 'hk-msg-bot');
    el.innerHTML = role === 'user' ? esc(text) : md(text);
    $msgs.appendChild(el);
    scrollToBottom();
    if (!opts.skipSave) {
      messages.push({ role: role, text: text });
      saveMsgs(messages);
    }
    return el;
  }

  function renderSaved() {
    messages.forEach(function (m) { pushMsg(m.role, m.text, { skipSave: true }); });
  }

  /* ── LEAD FORM ───────────────────────────────────────────────────────── */
  var leadFormShown = false;

  function showLeadForm(lastUserMsg) {
    if (leadFormShown) return;
    leadFormShown = true;

    var wrapper = document.createElement('div');
    wrapper.className = 'hk-msg hk-msg-bot';
    wrapper.style.maxWidth = '94%';

    var form = document.createElement('div');
    form.className = 'hk-lead-form';
    form.innerHTML = [
      '<h4>Deja tus datos y te contactamos</h4>',
      '<label>Nombre *</label>',
      '<input type="text" id="hk-f-nombre" placeholder="Tu nombre completo" maxlength="120">',
      '<label>Teléfono *</label>',
      '<input type="tel" id="hk-f-tel" placeholder="Ej: 999 999 999" maxlength="20">',
      '<label>Proyecto de interés</label>',
      '<select id="hk-f-proy">',
      '  <option value="">Selecciona un proyecto</option>',
      '  <option value="La Esmeralda Condominio (Pichanaki)">La Esmeralda (Pichanaki)</option>',
      '  <option value="Santa Inés (Orcotuna, Huancayo)">Santa Inés (Orcotuna)</option>',
      '  <option value="Ambos proyectos">Ambos me interesan</option>',
      '</select>',
      '<label>Email (opcional)</label>',
      '<input type="email" id="hk-f-email" placeholder="tucorreo@ejemplo.com" maxlength="120">',
      '<input type="text" id="hk-f-hp" style="display:none" tabindex="-1" autocomplete="off">',
      '<button class="hk-lead-form-submit" id="hk-f-submit">Enviar mis datos</button>',
      '<p class="hk-lead-note">Un asesor te contactará pronto.</p>',
    ].join('');
    wrapper.appendChild(form);
    $msgs.appendChild(wrapper);
    scrollToBottom();

    document.getElementById('hk-f-submit').addEventListener('click', function () {
      var nombre = (document.getElementById('hk-f-nombre').value || '').trim();
      var tel    = (document.getElementById('hk-f-tel').value || '').trim();
      var proy   = document.getElementById('hk-f-proy').value;
      var email  = (document.getElementById('hk-f-email').value || '').trim();
      var hp     = (document.getElementById('hk-f-hp').value || '').trim();

      if (hp) return;
      if (!nombre) { alert('Por favor ingresa tu nombre.'); return; }
      if (!tel)    { alert('Por favor ingresa tu teléfono.'); return; }

      var btn2 = document.getElementById('hk-f-submit');
      btn2.disabled = true;
      btn2.textContent = 'Enviando...';

      fetch(cfg.n8nBase + cfg.leadsPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre,
          telefono: tel,
          email: email,
          proyecto_interes: proy,
          mensaje: lastUserMsg || '',
          session_id: getSessionId()
        })
      })
      .then(function (r) { return r.json(); })
      .then(function () {
        form.innerHTML = [
          '<p style="color:' + cfg.primaryColor + ';font-weight:600;margin:0 0 8px;">¡Gracias, ' + esc(nombre) + '!</p>',
          '<p style="font-size:13px;color:#555;margin:0 0 10px;">Un asesor de Henko te contactará pronto al ' + esc(tel) + '.</p>',
          '<p style="font-size:13px;color:#555;margin:0 0 10px;">Si prefieres, escríbenos directamente por WhatsApp:</p>',
          '<a class="hk-wsp-cta" href="' + esc(cfg.whatsappUrl) + '" target="_blank" rel="noopener">',
          '  <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
          '  Escribir por WhatsApp',
          '</a>',
        ].join('');
        scrollToBottom();
      })
      .catch(function () {
        btn2.disabled = false;
        btn2.textContent = 'Reintentar';
        alert('Hubo un problema al enviar. Por favor llama al 932 846 404.');
      });
    });
  }

  /* Botón que abre el formulario bajo demanda (no auto-open). */
  function showFormButton(lastUserMsg) {
    if (leadFormShown) return;
    var wrapper = document.createElement('div');
    wrapper.className = 'hk-msg hk-msg-bot';
    wrapper.style.maxWidth = '94%';

    var openBtn = document.createElement('button');
    openBtn.className = 'hk-form-open-btn';
    openBtn.innerHTML = [
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">',
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
      '</svg>',
      ' Completar formulario'
    ].join('');

    openBtn.addEventListener('click', function () {
      wrapper.remove();
      showLeadForm(lastUserMsg);
    });

    wrapper.appendChild(openBtn);
    $msgs.appendChild(wrapper);
    scrollToBottom();
  }

  /* ── SEND MESSAGE ────────────────────────────────────────────────────── */
  function sendMessage(text) {
    text = (text || '').trim();
    if (!text || isBusy) return;

    isBusy = true;
    $send.disabled = true;
    $input.value = '';
    $input.style.height = 'auto';

    pushMsg('user', text);
    var typing = showTyping();

    var sessionId = getSessionId();
    var attempt = 0;
    var MAX = cfg.maxRetries;

    function doFetch() {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, cfg.timeoutMs) : null;

      fetch(cfg.n8nBase + cfg.webhookPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId, channel: 'web' }),
        signal: ctrl ? ctrl.signal : undefined
      })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        clearTimeout(timer);
        hideTyping();
        var resp = (data && data.response) || 'Lo siento, no pude procesar tu mensaje. Por favor intenta de nuevo.';
        var showForm = !!(data && data.showLeadForm);

        pushBotTypewritten(resp, function () {
          if (showForm) showFormButton(text);
          isBusy = false;
          $send.disabled = false;
          $input.focus();
        });
      })
      .catch(function (e) {
        clearTimeout(timer);
        attempt++;
        if (attempt <= MAX) {
          setTimeout(doFetch, 1200);
        } else {
          hideTyping();
          pushMsg('bot', 'Tuve un problema técnico. Por favor escríbenos por WhatsApp al 932 846 404 o llámanos.');
          isBusy = false;
          $send.disabled = false;
        }
      });
    }

    doFetch();
  }

  /* ── OPEN / CLOSE ────────────────────────────────────────────────────── */
  function openWidget() {
    isOpen = true;
    win.classList.add('hk-open');
    btn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

    if (!welcomed) {
      welcomed = true;
      renderSaved();
      if (messages.length === 0) {
        setTimeout(function () {
          pushBotTypewritten(cfg.welcomeMessage, null);
        }, 380);
      }
    }
    setTimeout(function () { $input.focus(); }, 200);
  }

  function closeWidget() {
    isOpen = false;
    win.classList.remove('hk-open');
    btn.innerHTML = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  }

  /* ── EVENTS ──────────────────────────────────────────────────────────── */
  btn.addEventListener('click', function () { isOpen ? closeWidget() : openWidget(); });
  $close.addEventListener('click', closeWidget);

  $send.addEventListener('click', function () { sendMessage($input.value); });

  $input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage($input.value);
    }
  });

  $input.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  });

  document.addEventListener('click', function (e) {
    if (isOpen && !win.contains(e.target) && e.target !== btn) closeWidget();
  });

})();
