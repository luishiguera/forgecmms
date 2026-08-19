const escapeHtml = (value: string) =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const PARAGRAPH =
	"font-size:15px;line-height:26.25px;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;color:#374151;margin:0 0 20px 0;margin-top:0;margin-right:0;margin-bottom:20px;margin-left:0";

const LINK = "color:#115E4C;text-decoration:underline;font-weight:600;";

const paragraph = (content: string) => `<p style="${PARAGRAPH}">${content}</p>`;

const layout = (
	body: string,
) => `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <style>
      @font-face {
        font-family: 'Inter';
        font-style: normal;
        font-weight: 400;
        mso-font-alt: 'sans-serif';
        src: url(https://cdn.jsdelivr.net/npm/@fontsource/inter/files/inter-latin-400-normal.woff2) format('woff2');
      }

      @font-face {
        font-family: 'Cal Sans';
        font-style: normal;
        font-weight: 600;
        src: url(https://cdn.jsdelivr.net/npm/@fontsource/cal-sans/files/cal-sans-latin-400-normal.woff2) format('woff2');
      }

      * {
        font-family: 'Inter', sans-serif;
      }
    </style>
    <style>
      blockquote,h1,h2,h3,img,li,ol,p,ul{margin-top:0;margin-bottom:0}@media only screen and (max-width:425px){.tab-row-full{width:100%!important}.tab-col-full{display:block!important;width:100%!important}.tab-pad{padding:0!important}}
    </style>
  </head>
  <body style="background-color:#ffffff">
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style="margin:0px;background-color:#ffffff;padding-top:0px;padding-right:0px;padding-bottom:0px;padding-left:0px">
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;margin-left:auto;margin-right:auto;border-style:solid;background-color:#ffffff;min-width:300px;padding-top:0.5rem;padding-right:0.5rem;padding-bottom:0.5rem;padding-left:0.5rem;border-radius:0px;border-width:0px;border-color:transparent">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:0px;margin-bottom:32px">
                      <tbody style="width:100%">
                        <tr style="width:100%">
                          <td align="left" data-id="__react-email-column">
                            <span style="font-family:'Cal Sans', sans-serif;font-size:32px;font-weight:600;color:#111827">forgecmms</span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    ${body}
                    ${paragraph("Regards,<br />The forgecmms team")}
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;

export const passwordResetEmail = (name: string, url: string) =>
	layout(
		[
			paragraph(`Hi ${escapeHtml(name)},`),
			paragraph(
				"We received a request to reset the password for your account. If you made this request, click the link below to create a new password:",
			),
			paragraph(
				`<a href="${escapeHtml(url)}" style="${LINK}">Reset password</a>`,
			),
			paragraph(
				"If you didn’t request a password reset, you can safely ignore this email.",
			),
		].join("\n                    "),
	);

export const invitationEmail = (
	organizationName: string,
	inviterName: string,
	url: string,
) =>
	layout(
		[
			paragraph("Hi there,"),
			paragraph(
				`${escapeHtml(inviterName)} has invited you to join <strong>${escapeHtml(organizationName)}</strong> on forgecmms. Click the link below to accept the invitation and set up your account:`,
			),
			paragraph(
				`<a href="${escapeHtml(url)}" style="${LINK}">Accept invitation</a>`,
			),
			paragraph(
				"This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.",
			),
		].join("\n                    "),
	);
