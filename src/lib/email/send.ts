"use server";

/**
 * Invitation email delivery.
 *
 * Email is OPTIONAL in this build: by default ZeRo youtip generates a
 * shareable invite link that the admin copies manually (no third-party
 * dependency, no verified domain required).
 *
 * To enable real delivery via Resend:
 *   1. npm install resend
 *   2. set RESEND_API_KEY and RESEND_FROM (e.g. "ZeRo youtip <noreply@your-domain>")
 *   3. uncomment the Resend block below.
 *
 * Returns true if an email was actually dispatched, false otherwise.
 */
export async function sendInvitationEmail(
  to: string,
  inviteUrl: string,
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Delivery disabled — the admin shares the link manually.
    void to;
    void inviteUrl;
    void invitationHtml;
    return false;
  }

  try {
    // `resend` is installed; this dynamic import keeps it off the critical
    // path and lets the app run even if delivery is misconfigured.
    const mod = await import("resend").catch(() => null);
    if (!mod) return false;

    const resend = new mod.Resend(apiKey);
    const from =
      process.env.RESEND_FROM ?? "ZeRo youtip <onboarding@resend.dev>";

    const { error } = await resend.emails.send({
      from,
      to,
      subject: "Tu es invité(e) sur ZeRo youtip",
      html: invitationHtml(inviteUrl),
    });
    return !error;
  } catch {
    return false;
  }
}

/** Sober inline-styled HTML email (no image, ZeRo wordmark in text). */
function invitationHtml(inviteUrl: string): string {
  return `
  <div style="background:#FAFAF9;padding:40px 0;font-family:Inter,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#fff;border:1px solid #E8E7E3;border-radius:16px;padding:32px;">
      <p style="margin:0 0 24px;font-size:20px;">
        <span style="font-weight:600;color:#1A1917;">ZeRo</span>
        <span style="font-weight:400;color:#9C9A92;"> youtip</span>
      </p>
      <h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1A1917;">
        Tu as été invité(e) à rejoindre ZeRo youtip
      </h1>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#6B6A66;">
        Écouter moins. Apprendre mieux. Agir davantage — transforme ta
        consommation passive de YouTube en apprentissage actif.
      </p>
      <a href="${inviteUrl}"
         style="display:inline-block;background:#3B72E8;color:#fff;text-decoration:none;
                font-size:14px;font-weight:500;padding:12px 24px;border-radius:10px;">
        Créer mon compte
      </a>
      <p style="margin:24px 0 0;font-size:13px;color:#9C9A92;">
        Ce lien expire dans 7 jours.
      </p>
      <hr style="border:none;border-top:1px solid #E8E7E3;margin:24px 0;" />
      <p style="margin:0;font-size:12px;color:#9C9A92;">
        Si tu n'attendais pas cette invitation, ignore cet email.
      </p>
    </div>
  </div>`;
}
