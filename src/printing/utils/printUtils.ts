import { Registration } from '../../types/attendee';

/**
 * Build a simple HTML badge for printing.
 * Keep it small and self-contained so PrintNode can render it.
 */
export const buildBadgeHtml = (registration: Registration): string => {
  const attendee = registration.attendee;
  const type = registration.eventAttendeeType?.attendeeType;
  const bg = type?.color_hex || '#E5E7EB';
  const text = type?.text_color_hex || '#0F172A';

  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; margin:0; padding:0; }
        .badge { width: 320px; height: 200px; display:flex; flex-direction:column; align-items:center; justify-content:center; border-radius:8px; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.12); }
        .avatar { width:84px; height:84px; border-radius:42px; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:28px; margin-bottom:12px; }
        .name { font-size:18px; font-weight:700; color:#0f172a; margin-bottom:4px }
        .company { font-size:14px; color:#475569 }
        .meta { margin-top:12px; font-size:12px; color:#475569 }
      </style>
    </head>
    <body>
      <div class="badge">
        <div class="avatar" style="background:${bg}; color:${text}">
          ${attendee.first_name?.[0] || ''}${attendee.last_name?.[0] || ''}
        </div>
        <div class="name">${escapeHtml(attendee.first_name)} ${escapeHtml(attendee.last_name)}</div>
        <div class="company">${escapeHtml(attendee.company || '')}</div>
        <div class="meta">${escapeHtml(registration.attendance_type || '')} • ${escapeHtml(registration.status)}</div>
      </div>
    </body>
  </html>`;

  return html;
};

function escapeHtml(str: string) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default buildBadgeHtml;
