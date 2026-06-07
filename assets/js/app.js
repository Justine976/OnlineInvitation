// ───────────────────────────────────────────────
// OnlineInvitation v2 — cache buster: 2026-06-06
// Shared utilities – available on every page
// ───────────────────────────────────────────────

/* ── dataCodec ─────────────────────────────── */

function encodeInvite(obj) {
  const json = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeInvite(str) {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = 4 - (base64.length % 4);
  const padded = padding === 4 ? base64 : base64 + '='.repeat(padding);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const json = new TextDecoder().decode(bytes);
  return JSON.parse(json);
}

function generateId() {
  const arr = new Uint8Array(4);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ── Safe localStorage wrapper ────────────── */

function safeGetItem(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function getAllSavedPlanKeys() {
  const keys = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('saved-plan-')) {
        keys.push(key);
      }
    }
  } catch {
    // localStorage unavailable
  }
  return keys.sort(function(a, b) { return b.localeCompare(a); });
}

/* ── Sharing formatting & theming ──────────── */

const typeLabels = {
  // Romantic Dates
  'coffee-date': 'Coffee & Conversation',
  'dinner-date': 'Candlelit Dinner',
  'sunset-drinks': 'Sunset Drinks',
  'stargazing': 'Stargazing & Dessert',
  'wine-tasting': 'Wine Tasting',
  'cooking-together': 'Cooking Together',
  // Creative & Fun
  'museum-date': 'Museum & Gallery',
  'art-class': 'Paint & Sip Class',
  'pottery-date': 'Pottery Workshop',
  'comedy-show': 'Comedy Club',
  'live-music': 'Live Music / Jazz',
  'dance-class': 'Dance Lesson',
  // Outdoor & Adventure
  'picnic-date': 'Park Picnic',
  'hiking-date': 'Scenic Hike',
  'beach-walk': 'Beach Sunset Walk',
  'botanical-garden': 'Botanical Garden',
  'bike-ride': 'Bike Ride & Brunch',
  'kayaking': 'Kayaking / Paddleboard',
  // Casual & Cozy
  'brunch-date': 'Weekend Brunch',
  'bookstore-date': 'Bookstore Browse',
  'farmers-market': 'Farmers Market',
  'ice-cream': 'Ice Cream Stroll',
  'board-games': 'Board Game Cafe',
  'movie-night': 'Movie & Dinner',
  // Friendly Hangout
  hangout: 'Friendly Hangout',
};

const answerLabels = {
  yes: 'Yes',
  no: 'No',
};

const VALID_THEMES = new Set(['blush', 'sunrise', 'garden', 'midnight', 'flirt']);

function resolveTheme(theme) {
  return VALID_THEMES.has(theme) ? theme : 'blush';
}

function applyTheme(theme) {
  const safe = resolveTheme(theme);
  VALID_THEMES.forEach(function(name) {
    document.body.classList.remove('theme-' + name);
  });
  document.body.classList.add('theme-' + safe);
  return safe;
}

function formatDate(value) {
  if (!value) {
    return 'To be decided';
  }
  const date = new Date(value + 'T00:00:00');
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) {
    return '';
  }
  const time = new Date('1970-01-01T' + value);
  if (Number.isNaN(time.getTime())) {
    return value;
  }
  return time.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatTimeRange(start, end) {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return s + ' \u2014 ' + e;
  if (s) return s;
  if (e) return e;
  return 'To be decided';
}

function setElementText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function setStatusMessage(id, message, tone) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.dataset.tone = tone || 'info';
}

// ───────────────────────────────────────────────
// PAGE: index.html – Builder / Create invitation
// ───────────────────────────────────────────────

(function initBuilderPage() {
  const form = document.getElementById('inviteForm');
  if (!form) return;

  const dateInput = document.getElementById('date');
  const previewCard = document.getElementById('previewCard');
  const createButton = document.getElementById('createButton');

  const fields = {
    email: document.getElementById('inviterEmail'),
    inviteeName: document.getElementById('inviteeName'),
    type: document.getElementById('type'),
    title: document.getElementById('title'),
    date: dateInput,
    timeStart: document.getElementById('timeStart'),
    timeEnd: document.getElementById('timeEnd'),
    place: document.getElementById('place'),
    todo: document.getElementById('todo'),
    message: document.getElementById('message'),
    theme: document.getElementById('theme'),
  };

  if (dateInput) {
    dateInput.min = new Date().toISOString().slice(0, 10);
  }

  function cleanValue(id) {
    return (fields[id] && fields[id].value.trim()) || '';
  }

  function updatePreview() {
    const theme = cleanValue('theme') || 'blush';
    const safe = applyTheme(theme);
    if (previewCard) {
      previewCard.className = 'invite-card preview-card theme-card theme-' + safe;
    }

    setElementText('previewHeading', cleanValue('title') || 'Your invitation title');
    setElementText('previewMessage', cleanValue('message') || 'Your personal note will appear here.');
    setElementText('previewType', typeLabels[cleanValue('type')] || typeLabels.hangout);
    setElementText('previewTypeDetail', typeLabels[cleanValue('type')] || typeLabels.hangout);
    setElementText('previewDate', formatDate(cleanValue('date')));
    setElementText('previewTime', formatTimeRange(cleanValue('timeStart'), cleanValue('timeEnd')));
    setElementText('previewInvitee', cleanValue('inviteeName') || 'Someone special');
    setElementText('previewPlace', cleanValue('place') || 'Choose a place');
    setElementText('previewTodo', cleanValue('todo') || 'Add the plan');
  }

  Object.values(fields).forEach(function(field) {
    if (!field) return;
    field.addEventListener('input', updatePreview);
    field.addEventListener('change', updatePreview);
  });

  // ── Save Plan (persist form data locally) ──────

  var savePlanButton = document.getElementById('savePlanButton');
  if (savePlanButton) {
    savePlanButton.addEventListener('click', function() {
      const planLabel = (cleanValue('title') || 'Untitled plan').slice(0, 60);
      const planKey = 'saved-plan-' + Date.now();
      const planData = {
        label: planLabel,
        savedAt: new Date().toISOString(),
        fields: {
          email: cleanValue('email'),
          inviteeName: cleanValue('inviteeName'),
          type: cleanValue('type'),
          title: cleanValue('title'),
          date: cleanValue('date'),
          timeStart: cleanValue('timeStart'),
          timeEnd: cleanValue('timeEnd'),
          place: cleanValue('place'),
          todo: cleanValue('todo'),
          message: cleanValue('message'),
          theme: cleanValue('theme'),
        },
      };

      if (safeSetItem(planKey, planData)) {
        setStatusMessage('createStatus', 'Plan "' + planLabel + '" saved.', 'success');
      } else {
        setStatusMessage('createStatus', 'Could not save plan. Storage may be full.', 'error');
      }

      if (typeof populateSavedPlans === 'function') {
        populateSavedPlans();
      }
    });
  }

  // ── Pre-Built Plan Templates ──────────────────

  var PREBUILT_PLANS;
  (function buildPrebuiltPlans() {
    var today = new Date();
    function offset(days) {
      var d = new Date(today);
      d.setDate(d.getDate() + days);
      return d.toISOString().slice(0, 10);
    }

    PREBUILT_PLANS = [
      {
        id: 'prebuilt-coffee-date',
        label: 'Coffee & Conversation',
        savedAt: new Date('2026-01-15').toISOString(),
        fields: { email: '', inviteeName: '', type: 'coffee-date', title: 'Coffee & Conversation', date: offset(7), timeStart: '15:00', timeEnd: '16:30', place: 'Cafe Luna, downtown', todo: 'Coffee first, then a walk somewhere pretty.', message: 'I picked this because it made me think of you.', theme: 'blush' },
      },
      {
        id: 'prebuilt-dinner-date',
        label: 'Candlelit Dinner',
        savedAt: new Date('2026-01-20').toISOString(),
        fields: { email: '', inviteeName: '', type: 'dinner-date', title: 'Candlelit Dinner', date: offset(5), timeStart: '19:00', timeEnd: '21:30', place: 'La Belle Époque, downtown', todo: 'Fine dining with wine pairing.', message: 'A night to remember, just for us.', theme: 'flirt' },
      },
      {
        id: 'prebuilt-sunset-drinks',
        label: 'Sunset Drinks',
        savedAt: new Date('2026-02-01').toISOString(),
        fields: { email: '', inviteeName: '', type: 'sunset-drinks', title: 'Sunset Drinks', date: offset(4), timeStart: '17:30', timeEnd: '20:00', place: 'Skyline Rooftop Bar', todo: 'Watch the sunset, sip cocktails, see where the night goes.', message: 'I know a place with a view that deserves someone like you.', theme: 'flirt' },
      },
      {
        id: 'prebuilt-picnic-date',
        label: 'Park Picnic',
        savedAt: new Date('2026-03-10').toISOString(),
        fields: { email: '', inviteeName: '', type: 'picnic-date', title: 'Park Picnic', date: offset(5), timeStart: '12:00', timeEnd: '15:00', place: 'Riverside Park', todo: 'Pack a basket, bring a blanket, enjoy the sun.', message: 'The weather\'s supposed to be beautiful!', theme: 'garden' },
      },
      {
        id: 'prebuilt-museum-date',
        label: 'Museum & Gallery',
        savedAt: new Date('2026-04-05').toISOString(),
        fields: { email: '', inviteeName: '', type: 'museum-date', title: 'Museum & Gallery', date: offset(10), timeStart: '14:00', timeEnd: '17:00', place: 'City Art Museum', todo: 'Explore the new exhibit, then grab dinner nearby.', message: 'Thought you\'d love the new Impressionist exhibit.', theme: 'midnight' },
      },
      {
        id: 'prebuilt-brunch-date',
        label: 'Weekend Brunch',
        savedAt: new Date('2026-02-01').toISOString(),
        fields: { email: '', inviteeName: '', type: 'brunch-date', title: 'Weekend Brunch', date: offset(3), timeStart: '10:30', timeEnd: '12:30', place: 'Sunny Side Bistro', todo: 'Brunch, then maybe browse the farmer\'s market.', message: 'It\'s been too long! Let\'s catch up.', theme: 'sunrise' },
      },
      {
        id: 'prebuilt-movie-night',
        label: 'Movie & Dinner',
        savedAt: new Date('2026-05-01').toISOString(),
        fields: { email: '', inviteeName: '', type: 'movie-night', title: 'Movie & Dinner', date: offset(2), timeStart: '18:30', timeEnd: '22:00', place: 'Cinema 9 & Olive Garden', todo: 'Catch the 7pm show, then dinner after.', message: 'Heard great things about this film — want to join?', theme: 'blush' },
      },
      {
        id: 'prebuilt-wine-tasting',
        label: 'Wine Tasting',
        savedAt: new Date('2026-06-01').toISOString(),
        fields: { email: '', inviteeName: '', type: 'wine-tasting', title: 'Wine Tasting', date: offset(6), timeStart: '16:00', timeEnd: '19:00', place: 'Vineyard Estate', todo: 'Guided tasting of 5 wines with cheese board.', message: 'Let\'s discover new favorites together.', theme: 'sunrise' },
      },
      {
        id: 'prebuilt-hiking-date',
        label: 'Scenic Hike',
        savedAt: new Date('2026-06-15').toISOString(),
        fields: { email: '', inviteeName: '', type: 'hiking-date', title: 'Scenic Hike', date: offset(8), timeStart: '09:00', timeEnd: '13:00', place: 'Mount Willow Trail', todo: 'Hike to the summit, picnic at the top.', message: 'The view is better with you there.', theme: 'garden' },
      },
      {
        id: 'prebuilt-art-class',
        label: 'Paint & Sip Class',
        savedAt: new Date('2026-07-01').toISOString(),
        fields: { email: '', inviteeName: '', type: 'art-class', title: 'Paint & Sip Class', date: offset(12), timeStart: '18:00', timeEnd: '20:30', place: 'Canvas & Cork Studio', todo: 'Follow along with instructor, sip wine, create art.', message: 'No experience needed — just bring your curiosity.', theme: 'blush' },
      },
    ];
  })();

  // ── Load / Delete Saved Plans ─────────────────

  var savedPlanSelect = document.getElementById('savedPlanSelect');
  var loadPlanButton = document.getElementById('loadPlanButton');
  var deletePlanButton = document.getElementById('deletePlanButton');

  function getPlanById(id) {
    if (id.startsWith('prebuilt-')) {
      for (var i = 0; i < PREBUILT_PLANS.length; i++) {
        if (PREBUILT_PLANS[i].id === id) return PREBUILT_PLANS[i];
      }
      return null;
    }
    return safeGetItem(id);
  }

  window.populateSavedPlans = function populateSavedPlans() {
    if (!savedPlanSelect) return;

    savedPlanSelect.innerHTML = '';

    var allPlans = PREBUILT_PLANS.map(function(plan) {
      return { id: plan.id, label: plan.label, savedAt: plan.savedAt, isPrebuilt: true };
    });

    var userKeys = getAllSavedPlanKeys();
    userKeys.forEach(function(key) {
      var stored = safeGetItem(key);
      if (stored && stored.label) {
        allPlans.push({ id: key, label: stored.label, savedAt: stored.savedAt, isPrebuilt: false });
      }
    });

    if (allPlans.length === 0) {
      var emptyOpt = document.createElement('option');
      emptyOpt.value = '';
      emptyOpt.disabled = true;
      emptyOpt.textContent = 'No plans available';
      savedPlanSelect.appendChild(emptyOpt);
      if (loadPlanButton) loadPlanButton.disabled = true;
      if (deletePlanButton) deletePlanButton.disabled = true;
      setStatusMessage('loadPlanStatus', '', 'info');
      return;
    }

    allPlans.forEach(function(entry) {
      var opt = document.createElement('option');
      opt.value = entry.id;
      var dateLabel = entry.savedAt
        ? new Date(entry.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
        : '';
      var prefix = entry.isPrebuilt ? '\uD83D\uDCCC ' : '\uD83D\uDCBE ';
      opt.textContent = prefix + entry.label + (dateLabel ? ' \u2014 ' + dateLabel : '');
      if (entry.isPrebuilt) opt.dataset.prebuilt = 'true';
      savedPlanSelect.appendChild(opt);
    });

    if (loadPlanButton) loadPlanButton.disabled = true;
    if (deletePlanButton) deletePlanButton.disabled = true;
    setStatusMessage('loadPlanStatus', '', 'info');
  };

  if (savedPlanSelect) {
    savedPlanSelect.addEventListener('change', function() {
      var hasSelection = savedPlanSelect.value !== '';
      var isPrebuilt = savedPlanSelect.selectedOptions[0] &&
                       savedPlanSelect.selectedOptions[0].dataset.prebuilt === 'true';
      if (loadPlanButton) loadPlanButton.disabled = !hasSelection;
      if (deletePlanButton) deletePlanButton.disabled = !hasSelection || isPrebuilt;
      setStatusMessage('loadPlanStatus', '', 'info');
    });
  }

  if (loadPlanButton) {
    loadPlanButton.addEventListener('click', function() {
      var key = savedPlanSelect ? savedPlanSelect.value : '';
      if (!key) return;

      var stored = getPlanById(key);
      if (!stored || !stored.fields) {
        setStatusMessage('loadPlanStatus', 'The selected plan could not be read.', 'error');
        return;
      }

      var f = stored.fields;
      if (fields.email) fields.email.value = f.email || '';
      if (fields.inviteeName) fields.inviteeName.value = f.inviteeName || '';
      if (fields.type) fields.type.value = f.type || 'hangout';
      if (fields.title) fields.title.value = f.title || '';
      if (fields.date) fields.date.value = f.date || '';
      if (fields.timeStart) fields.timeStart.value = f.timeStart || '';
      if (fields.timeEnd) fields.timeEnd.value = f.timeEnd || '';
      if (fields.place) fields.place.value = f.place || '';
      if (fields.todo) fields.todo.value = f.todo || '';
      if (fields.message) fields.message.value = f.message || '';
      if (fields.theme) fields.theme.value = f.theme || 'blush';

      updatePreview();
      setStatusMessage('loadPlanStatus', 'Plan "' + (stored.label || 'Loaded') + '" loaded into the form.', 'success');
    });
  }

  if (deletePlanButton) {
    deletePlanButton.addEventListener('click', function() {
      var key = savedPlanSelect ? savedPlanSelect.value : '';
      if (!key || key.startsWith('prebuilt-')) return;

      safeRemoveItem(key);
      setStatusMessage('loadPlanStatus', 'Plan discarded.', 'success');
      window.populateSavedPlans();
      if (loadPlanButton) loadPlanButton.disabled = true;
      if (deletePlanButton) deletePlanButton.disabled = true;
    });
  }

  window.populateSavedPlans();

  // ── Form Submit ──────────────────────────────

  form.addEventListener('submit', async function(event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    var inviteData = {
      email: cleanValue('email'),
      inviteeName: cleanValue('inviteeName'),
      type: cleanValue('type'),
      title: cleanValue('title'),
      date: cleanValue('date'),
      timeStart: cleanValue('timeStart'),
      timeEnd: cleanValue('timeEnd'),
      place: cleanValue('place'),
      todo: cleanValue('todo'),
      message: cleanValue('message'),
      theme: cleanValue('theme'),
    };

    createButton.disabled = true;
    setStatusMessage('createStatus', 'Creating your share link...', 'info');

    try {
      var id = generateId();
      inviteData.id = id;
      inviteData.createdAt = new Date().toISOString();

      safeSetItem('invitation-' + id, inviteData);

      var encoded = encodeInvite(inviteData);
      window.location.href = 'pages/homePage.html?id=' + encodeURIComponent(id) + '&data=' + encodeURIComponent(encoded);
    } catch (error) {
      createButton.disabled = false;
      setStatusMessage('createStatus', error.message || 'Could not create the share link. Please try again.', 'error');
    }
  });

  updatePreview();
})();

// ───────────────────────────────────────────────
// PAGE: homePage.html – Share / Copy link
// ───────────────────────────────────────────────

(function initSharePage() {
  var linkInput = document.getElementById('invitationLink');
  if (!linkInput) return;

  var params = new URLSearchParams(window.location.search);
  var invitationId = params.get('id');
  var encodedData = params.get('data');
  var openInvite = document.getElementById('openInvite');
  var copyButton = document.getElementById('copyButton');

  copyButton.disabled = true;
  if (openInvite) openInvite.setAttribute('aria-disabled', 'true');
  linkInput.value = 'Loading invite link...';

  function selectLink() {
    linkInput.focus();
    linkInput.select();
    linkInput.setSelectionRange(0, linkInput.value.length);
  }

  function loadInvite() {
    if (!invitationId || !encodedData) {
      linkInput.value = '';
      setElementText('shareSummary', 'No invitation data was included.');
      setStatusMessage('copyStatus', 'Create a new invite first.', 'error');
      return;
    }

    try {
      var invite = decodeInvite(encodedData);
      var invitationUrl = new URL('invitationPage.html#data=' + encodeURIComponent(encodedData), window.location.href);

      linkInput.value = invitationUrl.href;
      if (openInvite) {
        openInvite.href = invitationUrl.href;
        openInvite.removeAttribute('aria-disabled');
      }
      copyButton.disabled = false;
      setElementText('shareSummary', invite.title + ' at ' + invite.place + '.');
      setStatusMessage('copyStatus', 'Short link ready.', 'success');
    } catch (error) {
      linkInput.value = '';
      setElementText('shareSummary', 'The invite could not be loaded.');
      setStatusMessage('copyStatus', 'The invitation data is invalid.', 'error');
    }
  }

  async function copyLink() {
    try {
      if (!navigator.clipboard || !window.isSecureContext) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(linkInput.value);
      setStatusMessage('copyStatus', 'Copied. Send it when you are ready.', 'success');
    } catch (error) {
      selectLink();
      setStatusMessage('copyStatus', 'Clipboard access is unavailable here. The link is selected for manual copy.', 'warning');
    }
  }

  copyButton.addEventListener('click', copyLink);
  if (linkInput) linkInput.addEventListener('click', selectLink);
  loadInvite();
})();

// ───────────────────────────────────────────────
// PAGE: invitationPage.html – View & RSVP
// ───────────────────────────────────────────────

(function initInvitationPage() {
  var responseForm = document.getElementById('responseForm');
  if (!responseForm) return;

  var answerButtons = Array.from(responseForm.querySelectorAll('button'));
  var hash = window.location.hash.slice(1);
  var hashParams = new URLSearchParams(hash);
  var encodedData = hashParams.get('data');
  var inviteData = null;
  var noteInput = document.getElementById('note');
  var pendingAnswer = 'yes';

  answerButtons.forEach(function(button) { button.disabled = true; });
  answerButtons.forEach(function(button) {
    button.addEventListener('click', function() {
      pendingAnswer = button.value || pendingAnswer;
    });
  });

  if (noteInput) {
    noteInput.addEventListener('input', function() {
      noteInput.classList.remove('error');
    });
  }

  function renderInvite(invite) {
    applyTheme(invite.theme);
    var card = document.getElementById('inviteCard');
    if (card) {
      card.className = 'invite-card theme-card theme-' + resolveTheme(invite.theme);
    }
    setElementText('inviteType', typeLabels[invite.type] || typeLabels.hangout);
    setElementText('inviteTypeDetail', typeLabels[invite.type] || typeLabels.hangout);
    setElementText('inviteTitle', invite.title);
    setElementText('inviteMessage', invite.message);
    setElementText('inviteDate', formatDate(invite.date));
    setElementText('inviteTime', formatTimeRange(invite.timeStart, invite.timeEnd));
    setElementText('inviteInvitee', invite.inviteeName || 'Someone special');
    setElementText('invitePlace', invite.place);
    setElementText('inviteTodo', invite.todo);
  }

  function loadInvite() {
    if (!encodedData) {
      setElementText('inviteType', 'Invitation');
      setElementText('inviteTitle', 'Invite not found');
      setElementText('inviteMessage', 'This link is missing invitation data.');
      setStatusMessage('responseStatus', 'Ask for a new share link.', 'error');
      return;
    }

    try {
      inviteData = decodeInvite(encodedData);
      renderInvite(inviteData);

      // Check if this invitation already has a saved RSVP
      var hasRsvp = false;
      if (inviteData && inviteData.id) {
        var rsvpKey = 'rsvp-for-' + inviteData.id;
        var stored = safeGetItem(rsvpKey);
        if (stored) hasRsvp = true;
      }

      if (hasRsvp) {
        // Invitation has already been responded to — self-destruct
        window.location.replace('about:blank');
        return;
      }

      answerButtons.forEach(function(button) { button.disabled = false; });
      setStatusMessage('responseStatus', '', 'info');
    } catch (error) {
      setElementText('inviteType', 'Invitation');
      setElementText('inviteTitle', 'Invite not found');
      setElementText('inviteMessage', 'The invitation data could not be loaded.');
      setStatusMessage('responseStatus', 'Ask for a new share link.', 'error');
    }
  }

  responseForm.addEventListener('submit', async function(event) {
    event.preventDefault();

    // Custom validation with better UX
    if (!noteInput) {
      setStatusMessage('responseStatus', 'The response form is missing its note field.', 'error');
      return;
    }

    var note = noteInput.value.trim();

    // Clear previous error states
    noteInput.classList.remove('error');

    var hasError = false;

    if (!note) {
      noteInput.classList.add('error');
      setStatusMessage('responseStatus', 'Please add a short note.', 'error');
      noteInput.focus();
      hasError = true;
    }

    if (hasError) {
      return;
    }

    // Also run native HTML5 validation as fallback
    if (!event.currentTarget.reportValidity()) {
      return;
    }

    if (!inviteData) {
      setStatusMessage('responseStatus', 'The invite is still loading. Please try again in a moment.', 'warning');
      return;
    }

    var answer = event.submitter && event.submitter.value ? event.submitter.value : pendingAnswer;
    var rsvpId = generateId();

    // Use the invitee name from the invitation data
    var name = inviteData.inviteeName || 'Guest';

    var rsvpData = {
      id: rsvpId,
      invitationId: inviteData.id,
      answer: answer,
      name: name,
      note: note,
      createdAt: new Date().toISOString(),
    };

    // Save RSVP and mark invitation as responded
    safeSetItem('rsvp-' + rsvpId, rsvpData);
    if (inviteData && inviteData.id) {
      safeSetItem('rsvp-for-' + inviteData.id, { responded: true, rsvpId: rsvpId });
    }

    answerButtons.forEach(function(button) { button.disabled = true; });
    setStatusMessage('responseStatus', 'Saving your RSVP...', 'info');

    try {
      // Store minimal params in URL — the rest is looked up from localStorage
      var redirectParams = new URLSearchParams({
        id: inviteData.id,
        rsvp: rsvpId,
        name: name,
        answer: answer,
      });
      window.location.href = 'thankPage.html?' + redirectParams.toString();
    } catch (error) {
      answerButtons.forEach(function(button) { button.disabled = false; });
      setStatusMessage('responseStatus', error.message || 'Your RSVP could not be saved.', 'error');
    }
  });

  loadInvite();

  // ── Playful "Maybe next time" button ──────────
  (function initPlayfulNoButton() {
    var noButton = document.querySelector('.answer-row .secondary-button[value="no"]');
    if (!noButton) return;

    var dodgeCount = 0;
    var lastDodgeAt = 0;

    function canHoverDodge() {
      return window.matchMedia &&
        window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    }

    function maxDodges() {
      return canHoverDodge() ? 8 : 4;
    }

    function hasNote() {
      return noteInput && noteInput.value.trim().length > 0;
    }

    function showNoteError() {
      if (noteInput) {
        noteInput.classList.add('error');
        noteInput.focus();
      }
      setStatusMessage('responseStatus', 'Please add a short note.', 'error');
    }

    function resetButton() {
      noButton.style.position = '';
      noButton.style.left = '';
      noButton.style.top = '';
      noButton.style.zIndex = '';
      noButton.style.transition = '';
      noButton.classList.remove('is-teleporting');
      dodgeCount = 0;
      lastDodgeAt = 0;
    }

    function dodgeButton(isClick) {
      if (noButton.disabled || !hasNote()) return;

      // Always teleport on click (works on mobile too)
      // Only skip on hover for non-hover devices
      if (canHoverDodge() || isClick) {
        var rect = noButton.getBoundingClientRect();
        var margin = 18;
        var maxX = Math.max(margin, window.innerWidth - rect.width - margin);
        var maxY = Math.max(margin, window.innerHeight - rect.height - margin);
        var jump = Math.min(220, 95 + dodgeCount * 18);
        var directionX = Math.random() > 0.5 ? 1 : -1;
        var directionY = Math.random() > 0.5 ? 1 : -1;
        var currentX = rect.left;
        var currentY = rect.top;
        var newX = currentX + directionX * (jump + Math.random() * 120);
        var newY = currentY + directionY * (jump * 0.5 + Math.random() * 110);

        if (newX < margin || newX > maxX) {
          newX = margin + Math.random() * Math.max(0, maxX - margin);
        }

        if (newY < margin || newY > maxY) {
          newY = margin + Math.random() * Math.max(0, maxY - margin);
        }

        // Ensure button stays within viewport bounds (especially important for mobile)
        newX = Math.max(margin, Math.min(newX, maxX));
        newY = Math.max(margin, Math.min(newY, maxY));

        // Apply teleport styles directly
        noButton.style.cssText = 'position:fixed!important;left:' + newX + 'px!important;top:' + newY + 'px!important;z-index:99999!important;pointer-events:auto!important;transform:none!important;margin:0!important;';

        // Force repaint to ensure class takes effect
        noButton.classList.remove('is-teleporting');
        noButton.offsetHeight; // Force reflow
        noButton.classList.add('is-teleporting');
      } else {
        noButton.style.position = '';
        noButton.style.left = '';
        noButton.style.top = '';
        noButton.style.zIndex = '';
        noButton.style.transition = '';
        noButton.classList.remove('is-teleporting');
      }

      dodgeCount++;
      lastDodgeAt = Date.now();
      if (dodgeCount >= maxDodges()) {
        setStatusMessage('responseStatus', 'Okay. It is tired now. Try Maybe next time once more.', 'info');
      } else {
        setStatusMessage('responseStatus', 'That button is very hard to catch. Keep trying.', 'info');
      }
    }

    noButton.addEventListener('mouseenter', function() {
      if (canHoverDodge() && dodgeCount < maxDodges()) {
        dodgeButton();
      }
    });

    document.addEventListener('pointermove', function(event) {
      if (!canHoverDodge() || dodgeCount >= maxDodges() || noButton.disabled || !hasNote()) return;

      var now = Date.now();
      if (now - lastDodgeAt < 120) return;

      var rect = noButton.getBoundingClientRect();
      var centerX = rect.left + rect.width / 2;
      var centerY = rect.top + rect.height / 2;
      var distance = Math.hypot(event.clientX - centerX, event.clientY - centerY);
      var dangerZone = 150 + Math.min(dodgeCount * 12, 70);

      if (distance < dangerZone) {
        dodgeButton();
      }
    });

    noButton.addEventListener('click', function(event) {
      if (noButton.disabled) return;

      if (!hasNote()) {
        event.preventDefault();
        showNoteError();
        return;
      }

      if (dodgeCount < maxDodges()) {
        event.preventDefault();
        dodgeButton(true);
        return;
      }

      resetButton();
    });

    responseForm.addEventListener('submit', resetButton);
    window.addEventListener('resize', resetButton);
  })();
})();

// ───────────────────────────────────────────────
// PAGE: thankPage.html – Thank you & notify
// ───────────────────────────────────────────────

(function initThankPage() {
  var thankMessage = document.getElementById('thankMessage');
  if (!thankMessage) return;

  var params = new URLSearchParams(window.location.search);
  var invitationId = params.get('id') || '';
  var rsvpId = params.get('rsvp') || '';
  var name = params.get('name') || '';
  var answer = params.get('answer') || '';

  // Look up full invitation data from localStorage
  var inviteData = safeGetItem('invitation-' + invitationId);
  var rsvpData = safeGetItem('rsvp-' + rsvpId);
  var note = (rsvpData && rsvpData.note) || '';

  var closeTimer = 5;
  var closeMessageEl = document.createElement('p');
  closeMessageEl.className = 'status-message';
  closeMessageEl.style.marginTop = '24px';
  closeMessageEl.style.fontSize = '0.82rem';
  closeMessageEl.style.opacity = '0.65';
  document.getElementById('sendStatus').after(closeMessageEl);

  function updateCloseMessage() {
    closeMessageEl.textContent = 'Closing in ' + closeTimer + ' second' + (closeTimer !== 1 ? 's' : '') + '...';
  }

  function startCloseCountdown() {
    updateCloseMessage();
    var interval = setInterval(function() {
      closeTimer--;
      if (closeTimer <= 0) {
        clearInterval(interval);
        window.location.replace('about:blank');
      } else {
        updateCloseMessage();
      }
    }, 1000);
  }

  function notifyInviter() {
    if (!invitationId || !rsvpId) {
      thankMessage.textContent = 'Thanks. Your response page is missing its saved RSVP ID.';
      setStatusMessage('sendStatus', 'The response may be saved, but this page cannot load it.', 'warning');
      return;
    }

    thankMessage.textContent = 'Thanks, ' + name + '. Your answer has been saved.';

    var email = (inviteData && inviteData.email) || '';
    var type = (inviteData && inviteData.type) || '';
    var title = (inviteData && inviteData.title) || '';
    var date = (inviteData && inviteData.date) || '';
    var timeStart = (inviteData && inviteData.timeStart) || '';
    var timeEnd = (inviteData && inviteData.timeEnd) || '';
    var place = (inviteData && inviteData.place) || '';

    var templateParams = {
      to_email: email,
      response: 'Answer: ' + (answerLabels[answer] || answer || 'No answer'),
      note: 'Note: ' + (note || 'No note provided.'),
      name: name,
      type: typeLabels[type] || type,
      title: title,
      date: date,
      time: formatTimeRange(timeStart, timeEnd),
      place: place,
    };

    if (!email) {
      setStatusMessage('sendStatus', 'The RSVP is saved, but no inviter email was included.', 'warning');
      startCloseCountdown();
      return;
    }

    if (!window.emailjs) {
      setStatusMessage('sendStatus', 'The RSVP is saved, but EmailJS did not load.', 'warning');
      startCloseCountdown();
      return;
    }

    if (typeof EMAILJS_CONFIG === 'undefined') {
      setStatusMessage('sendStatus', 'The RSVP is saved, but EmailJS is not configured.', 'warning');
      startCloseCountdown();
      return;
    }

    emailjs.init(EMAILJS_CONFIG.publicKey);
    emailjs.send(EMAILJS_CONFIG.serviceID, EMAILJS_CONFIG.templateID, templateParams)
      .then(function() {
        setStatusMessage('sendStatus', 'The inviter has been notified.', 'success');
        startCloseCountdown();
      })
      .catch(function() {
        setStatusMessage('sendStatus', 'The RSVP is saved, but the email notification could not be confirmed.', 'warning');
        startCloseCountdown();
      });
  }

  notifyInviter();
})();
