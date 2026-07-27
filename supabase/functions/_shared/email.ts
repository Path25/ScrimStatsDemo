export type EmailContent = {
  subject: string;
  html: string;
  text: string;
};

type Detail = { label: string; value: string };

type EmailFrame = {
  preheader: string;
  eyebrow: string;
  title: string;
  intro: string;
  actionLabel: string;
  actionUrl: string;
  details?: Detail[];
  note?: string;
};

export const escapeHtml = (value: unknown) => String(value ?? "").replace(
  /[&<>"']/g,
  (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] || character,
);

const sentence = (value: unknown) => escapeHtml(value).replace(/\r?\n/g, "<br>");

function renderFrame({ preheader, eyebrow, title, intro, actionLabel, actionUrl, details = [], note }: EmailFrame) {
  const safeUrl = escapeHtml(actionUrl);
  const detailRows = details.map(({ label, value }, index) => `
    <tr>
      <td class="ss-detail-label" style="padding:${index === 0 ? "18px" : "0"} 20px 14px;color:#7f9299;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;vertical-align:top;width:118px;">${escapeHtml(label)}</td>
      <td class="ss-detail-value" style="padding:${index === 0 ? "18px" : "0"} 20px 14px 0;color:#eaf1f0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;vertical-align:top;">${escapeHtml(value)}</td>
    </tr>`).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>${escapeHtml(title)}</title>
  <style>
    @media only screen and (max-width:620px){.ss-shell{padding:18px 10px!important}.ss-card-pad{padding-left:24px!important;padding-right:24px!important}.ss-title{font-size:31px!important}.ss-action{width:100%!important}.ss-button{display:block!important;text-align:center!important}.ss-detail-label,.ss-detail-value{display:block!important;width:auto!important;padding-left:20px!important;padding-right:20px!important}.ss-detail-label{padding-top:16px!important;padding-bottom:5px!important}.ss-detail-value{padding-top:0!important;padding-bottom:16px!important}}
  </style>
</head>
<body style="margin:0;background:#060b0f;color:#eaf1f0;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}&#847; &#847; &#847;</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;background:#060b0f;">
    <tr><td class="ss-shell" align="center" style="padding:42px 16px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;">
        <tr><td style="padding:0 2px 18px;">
          <a href="https://scrimstats.gg" style="display:inline-block;text-decoration:none;">
            <img src="https://scrimstats.gg/ScrimStats%20logo.png" width="220" alt="ScrimStats by ProComps" style="display:block;width:220px;max-width:100%;height:auto;border:0;color:#f3f7f6;font-size:16px;font-weight:700;">
          </a>
        </td></tr>
        <tr><td style="border:1px solid #21313a;background:#0b1319;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr><td style="height:3px;background:#20d7c0;font-size:0;line-height:0;">&nbsp;</td></tr>
            <tr><td class="ss-card-pad" style="padding:42px 44px 20px;">
              <p style="margin:0;color:#20d7c0;font-family:'Courier New',Courier,monospace;font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">${escapeHtml(eyebrow)}</p>
              <h1 class="ss-title" style="margin:15px 0 0;color:#f3f7f6;font-size:38px;line-height:1.08;letter-spacing:-.035em;font-weight:650;">${escapeHtml(title)}</h1>
              <p style="margin:22px 0 0;color:#a4b2b7;font-size:16px;line-height:1.72;">${sentence(intro)}</p>
            </td></tr>
            <tr><td class="ss-card-pad" style="padding:10px 44px 34px;">
              <table class="ss-action" role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td bgcolor="#20d7c0">
                <a class="ss-button" href="${safeUrl}" style="display:inline-block;padding:14px 21px;color:#06110f;font-size:14px;font-weight:700;line-height:1;text-decoration:none;">${escapeHtml(actionLabel)} &nbsp;&rarr;</a>
              </td></tr></table>
            </td></tr>
            ${detailRows ? `<tr><td class="ss-card-pad" style="padding:0 44px 34px;"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #21313a;border-bottom:1px solid #21313a;">${detailRows}</table></td></tr>` : ""}
            <tr><td class="ss-card-pad" style="padding:0 44px 42px;">
              ${note ? `<p style="margin:0 0 16px;color:#7f9299;font-size:13px;line-height:1.65;">${sentence(note)}</p>` : ""}
              <p style="margin:0;color:#60747c;font-size:12px;line-height:1.65;">If the button does not work, copy this address into your browser:<br><a href="${safeUrl}" style="color:#93a6ac;text-decoration:underline;word-break:break-all;">${safeUrl}</a></p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:18px 2px 0;color:#60747c;font-size:11px;line-height:1.6;">ScrimStats keeps team operations, practice evidence and review connected.<br>&copy; ${new Date().getUTCFullYear()} ProComps. Private team software.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const textEmail = (frame: EmailFrame) => [
  `SCRIMSTATS / PROCOMPS`,
  frame.eyebrow.toUpperCase(),
  "",
  frame.title,
  "",
  frame.intro,
  "",
  `${frame.actionLabel}: ${frame.actionUrl}`,
  ...(frame.details?.flatMap(({ label, value }) => [`${label}: ${value}`]) || []),
  ...(frame.note ? ["", frame.note] : []),
  "",
  "ScrimStats keeps team operations, practice evidence and review connected.",
].join("\n");

function email(subject: string, frame: EmailFrame): EmailContent {
  return { subject, html: renderFrame(frame), text: textEmail(frame) };
}

export function workspaceInvitationEmail(input: { teamName: string; inviter: string; role: string; actionUrl: string; expiresAt: string }): EmailContent {
  const role = input.role === "member" ? "Team member" : input.role === "viewer" ? "Viewer" : input.role === "admin" ? "Workspace admin" : input.role;
  const frame: EmailFrame = {
    preheader: `${input.teamName} invited you into its private ScrimStats workspace.`,
    eyebrow: "Private workspace invitation",
    title: `Join ${input.teamName}.`,
    intro: `${input.inviter} has invited you into the team\u2019s working space for scheduling, practice capture and review. Your access is private to ${input.teamName}.`,
    actionLabel: "Join the workspace",
    actionUrl: input.actionUrl,
    details: [{ label: "Access", value: role }, { label: "Link expires", value: input.expiresAt }],
    note: "Use the same email address that received this invitation. You will create a password before entering the workspace.",
  };
  return email(`You\u2019re invited to ${input.teamName} on ScrimStats`, frame);
}

export function pilotWorkspaceEmail(input: { teamName: string; actionUrl: string }): EmailContent {
  const frame: EmailFrame = {
    preheader: `${input.teamName}\u2019s managed-pilot workspace is ready.`,
    eyebrow: "Managed pilot / Workspace ready",
    title: `Your ${input.teamName} workspace is live.`,
    intro: "Start by securing your owner account, confirming the roster and placing the first practice block on the calendar. We\u2019ll help you connect game capture and establish the review rhythm from there.",
    actionLabel: "Set up owner access",
    actionUrl: input.actionUrl,
    details: [{ label: "Workspace", value: input.teamName }, { label: "Access", value: "Owner" }, { label: "Link expires", value: "7 days" }],
    note: "This is a private workspace for your roster and staff. Reply to your ScrimStats contact if you want help with the first setup session.",
  };
  return email(`${input.teamName} is ready in ScrimStats`, frame);
}

export function operationalNotificationEmail(input: { templateKey: string; title: string; body: string; actionUrl: string }): EmailContent {
  const coaching = input.templateKey.startsWith("action_");
  const frame: EmailFrame = {
    preheader: `${input.title}: ${input.body}`,
    eyebrow: coaching ? "Coaching action" : "Practice operations",
    title: input.title,
    intro: input.body,
    actionLabel: coaching ? "Open coaching actions" : "Open practice block",
    actionUrl: input.actionUrl,
    note: "This operational email was sent because notifications are enabled for your ScrimStats workspace.",
  };
  return email(`${input.title} \u00b7 ScrimStats`, frame);
}
