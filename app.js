(() => {
  const KEY = 'contact-qr-v1';
  const starter = [
    { id: makeId(), name: 'Primary contact', phone: '+91 99528 73209', email: 'selvaero3@gmail.com' },
    { id: makeId(), name: 'Secondary contact', phone: '+1 202 555 0102', email: 'alternate@example.com' }
  ];
  let state;
  try { state = JSON.parse(localStorage.getItem(KEY)); } catch (_) { state = null; }
  if (!state || !Array.isArray(state.contacts) || state.contacts.length === 0) {
    state = { contacts: starter, selected: starter[0].id, defaultId: starter[0].id, channel: 'whatsapp', schemaVersion: 5 };
    persist();
  }
  if (!state.contacts.some(c => c.id === state.selected)) state.selected = state.contacts[0]?.id;
  if (!['whatsapp', 'email'].includes(state.channel)) state.channel = 'whatsapp';
  if (state.schemaVersion !== 5) {
    if (!state.schemaVersion) {
      const primary = state.contacts.find(c => digits(c.phone) === '919952873209')
        || state.contacts.find(c => digits(c.phone) === '12025550101');
      if (primary) {
        primary.phone = '+91 99528 73209';
        primary.email = 'selvaero3@gmail.com';
        state.defaultId = primary.id;
        state.selected = primary.id;
      }
    }
    state.contacts.forEach(c => { if (c.name === 'Alternate contact') c.name = 'Secondary contact'; });
    state.schemaVersion = 5;
    persist();
  }

  const $ = id => document.getElementById(id);
  const list = $('contactList'), qrRoot = $('qrCode'), dialog = $('contactDialog'), form = $('contactForm');
  let editingId = null, deferredInstall = null, toastTimer;
  function makeId() { return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `contact-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
  const current = () => state.contacts.find(c => c.id === state.selected) || state.contacts[0];
  function persist() { localStorage.setItem(KEY, JSON.stringify(state)); }
  function digits(phone) { return String(phone || '').replace(/\D/g, ''); }
  function destination(contact, channel = state.channel) {
    if (!contact) return '';
    return channel === 'email' ? `mailto:${contact.email || ''}` : `https://wa.me/${digits(contact.phone)}`;
  }
  function initials(name) { return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  function toast(message) {
    const node = $('toast'); node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2300);
  }
  function render() {
    const c = current();
    if (c && state.channel === 'email' && !c.email) { state.channel = 'whatsapp'; persist(); }
    list.innerHTML = '';
    state.contacts.forEach(contact => {
      const row = document.createElement('div');
      row.className = `contact-row${contact.id === c?.id ? ' active' : ''}`;
      const button = document.createElement('button');
      button.className = 'contact-chip';
      button.setAttribute('aria-pressed', String(contact.id === c?.id));
      button.innerHTML = `<span class="avatar">${escapeHTML(initials(contact.name))}</span><span class="chip-copy"><span class="chip-name">${escapeHTML(contact.name)}</span><span class="chip-phone">${escapeHTML(contact.phone)}</span>${contact.id === state.defaultId ? '<span class="default-badge">★ DEFAULT CONTACT</span>' : ''}</span>`;
      button.addEventListener('click', () => { state.selected = contact.id; persist(); render(); });
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'contact-row-edit';
      edit.setAttribute('aria-label', `Edit ${contact.name}`);
      edit.title = `Edit ${contact.name}`;
      edit.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg>';
      edit.addEventListener('click', () => openEditor(contact));
      row.append(button, edit); list.append(row);
    });
    document.querySelectorAll('.channel-option').forEach(button => {
      const active = button.dataset.channel === state.channel;
      button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active));
    });
    if (!c) return;
    const emailMode = state.channel === 'email';
    const target = emailMode ? c.email : c.phone;
    $('detailLabel').textContent = emailMode ? 'EMAIL ADDRESS' : 'WHATSAPP NUMBER';
    $('detailValue').textContent = target || 'Add an email to this contact';
    $('detailSub').textContent = emailMode ? 'Used by this QR to address a new email' : 'Used by this QR to open a direct chat';
    $('qrContactName').textContent = c.name;
    $('qrHeading').textContent = emailMode ? 'Email QR' : 'WhatsApp QR';
    $('qrCaption').textContent = emailMode ? 'EMAIL' : 'WHATSAPP';
    $('qrInstruction').textContent = emailMode ? `Scan this code to compose an email to ${c.name}.` : `Scan this code to start a WhatsApp chat with ${c.name}.`;
    const link = destination(c);
    $('setDefaultBtn').textContent = c.id === state.defaultId ? '★ Default contact' : '☆ Set as default';
    $('setDefaultBtn').disabled = c.id === state.defaultId;
    $('deleteContactBtn').disabled = state.contacts.length === 1;
    document.querySelector('.channel-option[data-channel="email"]').disabled = !c.email;
    document.querySelector('.channel-option[data-channel="email"]').title = c.email ? '' : 'Add an email address to this contact first';
    qrRoot.innerHTML = '';
    $('qrEmpty').hidden = true;
    if (!target || !window.QRCode) { $('qrEmpty').hidden = false; return; }
    try {
      new QRCode(qrRoot, { text: link, width: 184, height: 184, colorDark: '#17382c', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    } catch (err) { $('qrEmpty').hidden = false; }
  }
  function escapeHTML(value) { return String(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }
  function openEditor(contact = null) {
    editingId = contact?.id || null;
    $('dialogTitle').textContent = editingId ? 'Edit contact' : 'Add a contact';
    $('nameInput').value = contact?.name || ''; $('phoneInput').value = contact?.phone || '';
    $('emailInput').value = contact?.email || ''; $('defaultInput').checked = contact ? contact.id === state.defaultId : state.contacts.length === 0;
    $('formError').textContent = ''; dialog.showModal(); $('nameInput').focus();
  }
  $('addContactBtn').addEventListener('click', () => openEditor());
  $('closeDialog').addEventListener('click', () => dialog.close()); $('cancelDialog').addEventListener('click', () => dialog.close());
  form.addEventListener('submit', event => {
    event.preventDefault();
    const name = $('nameInput').value.trim(), phone = $('phoneInput').value.trim(), email = $('emailInput').value.trim();
    const normalizedPhone = digits(phone);
    if (!name) { $('formError').textContent = 'Add a display name.'; return; }
    if (normalizedPhone.length < 8 || normalizedPhone.length > 15) { $('formError').textContent = 'Enter a valid number with country code (8–15 digits).'; return; }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('formError').textContent = 'Enter a valid email address.'; return; }
    let contact = editingId && state.contacts.find(item => item.id === editingId);
    if (!contact) { contact = { id: makeId() }; state.contacts.push(contact); }
    Object.assign(contact, { name, phone: `+${normalizedPhone}`, email });
    if (!state.selected || !editingId) state.selected = contact.id;
    if ($('defaultInput').checked || !state.defaultId) state.defaultId = contact.id;
    persist(); dialog.close(); render(); toast(editingId ? 'Contact updated' : 'Contact added');
  });
  $('deleteContactBtn').addEventListener('click', () => {
    const c = current(); if (!c || state.contacts.length < 2) return;
    if (!confirm(`Remove ${c.name} from this device?`)) return;
    state.contacts = state.contacts.filter(item => item.id !== c.id);
    if (state.defaultId === c.id) state.defaultId = state.contacts[0].id;
    if (state.selected === c.id) state.selected = state.defaultId;
    persist(); render(); toast('Contact removed');
  });
  $('setDefaultBtn').addEventListener('click', () => { state.defaultId = current().id; persist(); render(); toast('Default contact updated'); });
  document.querySelectorAll('.channel-option').forEach(button => button.addEventListener('click', () => {
    if (button.dataset.channel === 'email' && !current()?.email) { toast('Add an email address to use email QR codes'); return; }
    state.channel = button.dataset.channel; persist(); render();
  }));
  $('copyBtn').addEventListener('click', async () => {
    const link = destination(current()); if (!link || (state.channel === 'email' && !current().email)) { toast('Add the missing contact detail first'); return; }
    try { await navigator.clipboard.writeText(link); toast('Contact link copied'); }
    catch (_) { const input = document.createElement('textarea'); input.value = link; document.body.append(input); input.select(); document.execCommand('copy'); input.remove(); toast('Contact link copied'); }
  });
  $('downloadBtn').addEventListener('click', () => {
    const image = qrRoot.querySelector('img'); const canvas = qrRoot.querySelector('canvas');
    const data = image?.src || canvas?.toDataURL('image/png');
    if (!data) { toast('QR code is not ready yet'); return; }
    const a = document.createElement('a'); a.href = data; a.download = `${current().name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${state.channel}-qr.png`; a.click();
  });
  $('shareBtn').addEventListener('click', async () => {
    const url = destination(current());
    if (navigator.share) { try { await navigator.share({ title: `${current().name} contact`, text: `Connect via ${state.channel}`, url }); } catch (_) {} }
    else { try { await navigator.clipboard.writeText(url); toast('Contact link copied'); } catch (_) { toast('Use Download PNG to share the QR code'); } }
  });
  $('settingsBtn').addEventListener('click', () => $('settingsDialog').showModal());
  document.querySelector('[data-close-settings]').addEventListener('click', () => $('settingsDialog').close());
  $('resetBtn').addEventListener('click', () => {
    if (!confirm('Reset all contacts saved on this device?')) return;
    localStorage.removeItem(KEY); state = { contacts: starter, selected: starter[0].id, defaultId: starter[0].id, channel: 'whatsapp', schemaVersion: 5 }; persist(); render(); $('settingsDialog').close(); toast('Contacts reset to the starter list');
  });
  window.addEventListener('beforeinstallprompt', event => { event.preventDefault(); deferredInstall = event; $('installBtn').hidden = false; });
  $('installBtn').addEventListener('click', async () => {
    if (!deferredInstall) return;
    deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $('installBtn').hidden = true;
  });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  render();
})();
