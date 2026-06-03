// ── Auth guard ────────────────────────────────────────────────────────────────
if (!localStorage.getItem('token')) {
    window.location.href = '/pages/login.html';
}

// ── State ─────────────────────────────────────────────────────────────────────
let calendar;
let allMeetings = [];
let filteredMeetings = [];
let selectedColor = '#4f6ef7';
let currentMeetingId = null;
let statusFilter = '';

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    setupUserInfo();
    setPageDate();
    await loadMeetings();
    renderDashboard();
    initCalendar();
    startReminderPoller();
});

// ── User info in sidebar ───────────────────────────────────────────────────────
function setupUserInfo() {
    const username = localStorage.getItem('username') || 'User';
    const role     = localStorage.getItem('role') || 'member';

    document.getElementById('sidebar-username').textContent = username;
    document.getElementById('sidebar-role').textContent = role.toLowerCase();
    document.getElementById('sidebar-avatar').textContent = username.charAt(0).toUpperCase();
}

function setPageDate() {
    const now = new Date();
    document.getElementById('page-date').textContent = now.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
}

// ── Load meetings ─────────────────────────────────────────────────────────────
async function loadMeetings() {
    try {
        allMeetings = await api.get('/api/meetings');
        filteredMeetings = [...allMeetings];
    } catch(e) {
        console.error('Load failed:', e);
    }
}

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
function renderDashboard() {
    const now = new Date();
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);

    const total     = allMeetings.length;
    const thisWeek  = allMeetings.filter(m => {
        const s = new Date(m.startTime);
        return s >= now && s <= weekEnd;
    }).length;
    const upcoming  = allMeetings.filter(m => new Date(m.startTime) > now && m.status === 'SCHEDULED').length;
    const completed = allMeetings.filter(m => m.status === 'COMPLETED').length;

    document.getElementById('stat-total').textContent     = total;
    document.getElementById('stat-week').textContent      = thisWeek;
    document.getElementById('stat-upcoming').textContent  = upcoming;
    document.getElementById('stat-completed').textContent = completed;

    renderNextMeeting();
    renderTodaySchedule();
    renderRecentMeetings();
}

function renderNextMeeting() {
    const now = new Date();
    const next = allMeetings
        .filter(m => new Date(m.startTime) > now && m.status === 'SCHEDULED')
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))[0];

    const el = document.getElementById('next-meeting-content');
    if (!next) {
        el.innerHTML = '<div class="next-empty">No upcoming meetings scheduled 🎉</div>';
        return;
    }

    const start = new Date(next.startTime);
    const diff  = Math.round((start - now) / 60000); // minutes
    const countdown = diff < 60
        ? `In ${diff} min`
        : diff < 1440
            ? `In ${Math.floor(diff/60)}h ${diff%60}m`
            : `In ${Math.floor(diff/1440)} day${Math.floor(diff/1440)>1?'s':''}`;

    el.innerHTML = `
        <div class="color-strip" style="background:${next.color||'#4f6ef7'}"></div>
        <div class="next-countdown">${countdown}</div>
        <div class="next-title">${next.title}</div>
        <div class="next-meta">
            <div class="next-meta-item">📅 ${formatDate(next.startTime)}</div>
            <div class="next-meta-item">🕐 ${formatTime(next.startTime)} — ${formatTime(next.endTime)}</div>
            ${next.location ? `<div class="next-meta-item">📍 ${next.location}</div>` : ''}
        </div>
    `;

    document.getElementById('next-meeting-card').style.cursor = 'pointer';
    document.getElementById('next-meeting-card').onclick = () => openDetailModal(next.id);
}

function renderTodaySchedule() {
    const today = new Date();
    const todayStr = today.toDateString();

    const todayMeetings = allMeetings
        .filter(m => new Date(m.startTime).toDateString() === todayStr)
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    document.getElementById('today-count').textContent = todayMeetings.length;

    const el = document.getElementById('today-list');
    if (!todayMeetings.length) {
        el.innerHTML = '<div class="empty-small">Nothing scheduled for today</div>';
        return;
    }

    el.innerHTML = todayMeetings.map(m => `
        <div class="today-item" onclick="openDetailModal(${m.id})">
            <div class="today-time">${formatTime(m.startTime)}</div>
            <div class="today-dot" style="background:${m.color||'#4f6ef7'}"></div>
            <div class="today-info">
                <div class="today-title">${m.title}</div>
                ${m.location ? `<div class="today-loc">📍 ${m.location}</div>` : ''}
            </div>
        </div>
    `).join('');
}

function renderRecentMeetings() {
    const recent = [...allMeetings]
        .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
        .slice(0, 5);

    const el = document.getElementById('recent-list');
    if (!recent.length) {
        el.innerHTML = '<div class="empty-small">No meetings yet</div>';
        return;
    }

    el.innerHTML = recent.map(m => `
        <div class="recent-item" onclick="openDetailModal(${m.id})">
            <div class="recent-color" style="background:${m.color||'#4f6ef7'}"></div>
            <div class="recent-info">
                <div class="recent-title">${m.title}</div>
                <div class="recent-date">${formatDate(m.startTime)} · ${formatTime(m.startTime)}</div>
            </div>
            <span class="badge badge-${m.status}">${m.status}</span>
        </div>
    `).join('');
}

// ── Views ─────────────────────────────────────────────────────────────────────
const viewTitles = {
    dashboard: 'Dashboard',
    calendar:  'Calendar',
    meetings:  'All Meetings',
    upcoming:  'Upcoming'
};

function showView(name, btn) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');
    document.getElementById('page-title').textContent = viewTitles[name] || name;

    if (btn) btn.classList.add('active');

    if (name === 'meetings')  renderMeetingList(filteredMeetings);
    if (name === 'upcoming')  renderUpcoming();
    if (name === 'calendar' && calendar) calendar.render();
}

// ── All meetings list ─────────────────────────────────────────────────────────
function renderMeetingList(meetings) {
    const el = document.getElementById('meeting-list');
    if (!meetings.length) {
        el.innerHTML = '<div class="empty-state">No meetings found.<br>Click "+ New Meeting" to create one.</div>';
        return;
    }
    el.innerHTML = meetings.map(m => `
        <div class="meeting-card" onclick="openDetailModal(${m.id})">
            <div class="meeting-color-bar" style="background:${m.color||'#4f6ef7'}"></div>
            <div class="meeting-info">
                <div class="meeting-title">${m.title}</div>
                <div class="meeting-meta">
                    <span>📅 ${formatDate(m.startTime)}</span>
                    <span>🕐 ${formatTime(m.startTime)} — ${formatTime(m.endTime)}</span>
                    ${m.location ? `<span>📍 ${m.location}</span>` : ''}
                </div>
            </div>
            <span class="badge badge-${m.status}">${m.status}</span>
        </div>
    `).join('');
}

function filterMeetings(q) {
    filteredMeetings = allMeetings.filter(m => {
        const matchQ = !q ||
            m.title.toLowerCase().includes(q.toLowerCase()) ||
            (m.description||'').toLowerCase().includes(q.toLowerCase()) ||
            (m.location||'').toLowerCase().includes(q.toLowerCase());
        const matchStatus = !statusFilter || m.status === statusFilter;
        return matchQ && matchStatus;
    });
    renderMeetingList(filteredMeetings);
}

function filterByStatus(val) {
    statusFilter = val;
    filterMeetings(document.querySelector('.search-input')?.value || '');
}

function renderUpcoming() {
    const now = new Date();
    const weekEnd = new Date(); weekEnd.setDate(weekEnd.getDate() + 7);
    const upcoming = allMeetings
        .filter(m => { const s = new Date(m.startTime); return s >= now && s <= weekEnd; })
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const el = document.getElementById('upcoming-list');
    if (!upcoming.length) {
        el.innerHTML = '<div class="empty-state">No meetings in the next 7 days 🎉</div>';
        return;
    }
    el.innerHTML = upcoming.map(m => `
        <div class="meeting-card" onclick="openDetailModal(${m.id})">
            <div class="meeting-color-bar" style="background:${m.color||'#4f6ef7'}"></div>
            <div class="meeting-info">
                <div class="meeting-title">${m.title}</div>
                <div class="meeting-meta">
                    <span>📅 ${formatDate(m.startTime)}</span>
                    <span>🕐 ${formatTime(m.startTime)} — ${formatTime(m.endTime)}</span>
                    ${m.location ? `<span>📍 ${m.location}</span>` : ''}
                </div>
            </div>
            <span class="badge badge-${m.status}">${m.status}</span>
        </div>
    `).join('');
}

// ── Calendar ──────────────────────────────────────────────────────────────────
function initCalendar() {
    const el = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(el, {
        initialView: 'dayGridMonth',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        events: allMeetings.map(toCalEvent),
        eventClick(info) { openDetailModal(info.event.id); },
        dateClick(info)  { openCreateModal(info.dateStr);  },
        height: 'calc(100vh - 110px)'
    });
    calendar.render();
}

function toCalEvent(m) {
    return { id: m.id, title: m.title, start: m.startTime, end: m.endTime, color: m.color || '#4f6ef7' };
}

function refreshCalendar() {
    if (!calendar) return;
    calendar.removeAllEvents();
    calendar.addEventSource(allMeetings.map(toCalEvent));
}

// ── Create / Edit Modal ───────────────────────────────────────────────────────
function openCreateModal(dateStr) {
    currentMeetingId = null;
    document.getElementById('modal-title').textContent = 'New Meeting';
    document.getElementById('meeting-id').value = '';
    document.getElementById('m-title').value = '';
    document.getElementById('m-start').value = dateStr ? dateStr + 'T09:00' : '';
    document.getElementById('m-end').value   = dateStr ? dateStr + 'T10:00' : '';
    document.getElementById('m-location').value = '';
    document.getElementById('m-description').value = '';
    document.getElementById('m-status').value = 'SCHEDULED';
    document.getElementById('delete-btn').classList.add('hidden');
    document.getElementById('conflict-warning').classList.add('hidden');
    setColor(document.querySelector('.cdot'));
    document.getElementById('meeting-modal').classList.remove('hidden');
}

function openEditModal(meeting) {
    currentMeetingId = meeting.id;
    document.getElementById('modal-title').textContent = 'Edit Meeting';
    document.getElementById('meeting-id').value = meeting.id;
    document.getElementById('m-title').value = meeting.title;
    document.getElementById('m-start').value = meeting.startTime?.substring(0, 16) || '';
    document.getElementById('m-end').value   = meeting.endTime?.substring(0, 16)   || '';
    document.getElementById('m-location').value = meeting.location || '';
    document.getElementById('m-description').value = meeting.description || '';
    document.getElementById('m-status').value = meeting.status || 'SCHEDULED';
    document.getElementById('delete-btn').classList.remove('hidden');
    document.getElementById('conflict-warning').classList.add('hidden');

    // Set color dot
    document.querySelectorAll('.cdot').forEach(d => {
        d.classList.toggle('active', d.dataset.color === meeting.color);
    });
    selectedColor = meeting.color || '#4f6ef7';
    document.getElementById('m-color').value = selectedColor;

    closeDetailModal();
    document.getElementById('meeting-modal').classList.remove('hidden');
}

function closeModal() { document.getElementById('meeting-modal').classList.add('hidden'); }

function setColor(el) {
    if (!el) return;
    document.querySelectorAll('.cdot').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    selectedColor = el.dataset.color;
    document.getElementById('m-color').value = selectedColor;
}

async function saveMeeting() {
    const title = document.getElementById('m-title').value.trim();
    const start = document.getElementById('m-start').value;
    const end   = document.getElementById('m-end').value;

    if (!title || !start || !end) { alert('Please fill in title, start and end time.'); return; }
    if (new Date(end) <= new Date(start)) { alert('End time must be after start time.'); return; }

    const body = {
        title,
        startTime:   start + ':00',
        endTime:     end   + ':00',
        location:    document.getElementById('m-location').value,
        description: document.getElementById('m-description').value,
        status:      document.getElementById('m-status').value,
        color:       selectedColor
    };

    try {
        if (currentMeetingId) {
            const updated = await api.put(`/api/meetings/${currentMeetingId}`, body);
            allMeetings = allMeetings.map(m => m.id === currentMeetingId ? updated : m);
        } else {
            const created = await api.post('/api/meetings', body);
            allMeetings.push(created);
        }
        filteredMeetings = [...allMeetings];
        refreshCalendar();
        renderDashboard();
        renderMeetingList(filteredMeetings);
        closeModal();
    } catch(e) {
        if (e.message?.toLowerCase().includes('conflict')) {
            document.getElementById('conflict-warning').classList.remove('hidden');
        } else {
            alert('Error: ' + e.message);
        }
    }
}

async function deleteMeetingFromModal() {
    if (!confirm('Delete this meeting? This cannot be undone.')) return;
    try {
        await api.delete(`/api/meetings/${currentMeetingId}`);
        allMeetings = allMeetings.filter(m => m.id !== currentMeetingId);
        filteredMeetings = [...allMeetings];
        refreshCalendar();
        renderDashboard();
        renderMeetingList(filteredMeetings);
        closeModal();
    } catch(e) { alert('Delete failed: ' + e.message); }
}

// ── Detail Modal ──────────────────────────────────────────────────────────────
function openDetailModal(id) {
    const m = allMeetings.find(m => String(m.id) === String(id));
    if (!m) return;

    document.getElementById('detail-title').textContent = m.title;
    document.getElementById('detail-body').innerHTML = `
        <div class="detail-color-bar" style="background:${m.color||'#4f6ef7'}"></div>
        <div class="detail-row"><span>📅 Date</span><strong>${formatDate(m.startTime)}</strong></div>
        <div class="detail-row"><span>🕐 Time</span><strong>${formatTime(m.startTime)} — ${formatTime(m.endTime)}</strong></div>
        ${m.location ? `<div class="detail-row"><span>📍 Location</span><strong>${m.location}</strong></div>` : ''}
        <div class="detail-row"><span>📊 Status</span><span class="badge badge-${m.status}">${m.status}</span></div>
        ${m.organizer ? `<div class="detail-row"><span>👤 Organizer</span><strong>${m.organizer.username || 'You'}</strong></div>` : ''}
        ${m.description ? `<div class="detail-desc">${m.description}</div>` : ''}
    `;
    document.getElementById('detail-edit-btn').onclick = () => openEditModal(m);
    document.getElementById('detail-modal').classList.remove('hidden');
}

function closeDetailModal() { document.getElementById('detail-modal').classList.add('hidden'); }

// ── Reminder poller ───────────────────────────────────────────────────────────
function startReminderPoller() {
    setInterval(async () => {
        try {
            const reminders = await api.get('/api/reminders/pending');
            if (reminders.length) showReminderToast(reminders[0]);
        } catch(e) { /* silent */ }
    }, 30000);
}

function showReminderToast(r) {
    document.getElementById('toast-title').textContent = r.title;
    document.getElementById('toast-time').textContent  = formatDateTime(r.startTime);
    document.getElementById('toast-loc').textContent   = r.location || '';
    document.getElementById('reminder-toast').classList.remove('hidden');
    setTimeout(dismissReminder, 12000);
}

function dismissReminder() {
    document.getElementById('reminder-toast').classList.add('hidden');
}

// ── Logout ────────────────────────────────────────────────────────────────────
function logout() {
    if (!confirm('Sign out of MeetSync?')) return;
    localStorage.clear();
    window.location.href = '/pages/login.html';
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatDate(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDateTime(dt) {
    if (!dt) return '';
    return new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
