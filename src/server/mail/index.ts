export type MailMessage = {
	to: string;
	subject: string;
	html: string;
};

export const isMailConfigured = () =>
	Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM);

export const sendMail = async (message: MailMessage) => {
	if (!isMailConfigured()) {
		console.warn(
			`mail skipped, RESEND_API_KEY or RESEND_FROM missing: "${message.subject}" to ${message.to}`,
		);
		return;
	}

	const response = await fetch("https://api.resend.com/emails", {
		method: "POST",
		headers: {
			authorization: `Bearer ${process.env.RESEND_API_KEY}`,
			"content-type": "application/json",
		},
		body: JSON.stringify({
			from: process.env.RESEND_FROM,
			to: [message.to],
			subject: message.subject,
			html: message.html,
		}),
	});

	if (!response.ok) {
		throw new Error(
			`resend rejected the message: ${response.status} ${await response.text()}`,
		);
	}
};
