import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendResetPasswordEmail(
	email: string,
	url: string,
	date: Date,
	userAgent: string,
	ipAddress: string,
) {
	await resend.emails.send({
		from: "Beam <no-reply@beam.ejnalo.me>",
		to: email,
		subject: "Beam - Réinitialisation de votre mot de passe",

		html: `
			<p>Vous avez demandé une réinitialisation de votre mot de passe pour votre compte Beam.</p>
			<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
			<p>Cette demande a été faite le ${date.toLocaleString()} depuis ${userAgent} (${ipAddress}).</p>

			<a href="${url}">
				Réinitialiser mon mot de passe
			</a>
		`,
	});
}

export async function sendPasswordChangedEmail(
	email: string,
	url: string,
	date: Date,
	userAgent: string,
	ipAddress: string,
) {
	await resend.emails.send({
		from: "Beam <no-reply@beam.ejnalo.me>",
		to: email,
		subject: "Beam - Modification de votre mot de passe",

		html: `
			<p>Votre mot de passe a été modifié avec succès.</p>
			<p>Si vous n'êtes pas à l'origine de cette action, veuillez réinitialiser votre mot de passe immédiatement en cliquant sur le lien ci-dessous :</p>

			<a href="${url}">
				Réinitialiser mon mot de passe
			</a>

			<p>Cette action a été effectuée le ${date.toLocaleString()} depuis ${userAgent} (${ipAddress}).</p>
		`,
	});
}

export async function sendEmailConfirmation(
	email: string,
	url: string,
	date: Date,
	userAgent: string,
	ipAddress: string,
) {
	await resend.emails.send({
		from: "Beam <no-reply@beam.ejnalo.me>",
		to: email,
		subject: "Beam - Confirmation de votre adresse e-mail",

		html: `
			<p>Vous avez demandé la confirmation de votre adresse e-mail pour votre compte Beam.</p>
			<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
			<p>Cette demande a été faite le ${date.toLocaleString()} depuis ${userAgent} (${ipAddress}).</p>

			<a href="${url}">
				Confirmer mon adresse e-mail
			</a>
		`,
	});
}

export async function sendEmailModified(
	email: string,
	url: string,
	date: Date,
	userAgent: string,
	ipAddress: string,
) {
	await resend.emails.send({
		from: "Beam <no-reply@beam.ejnalo.me>",
		to: email,
		subject: "Beam - Modification de votre adresse e-mail",

		html: `
			<p>Vous avez demandé la modification de votre adresse e-mail pour votre compte Beam.</p>
			<p>Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet e-mail en toute sécurité.</p>
			<p>Cette demande a été faite le ${date.toLocaleString()} depuis ${userAgent} (${ipAddress}).</p>

			<a href="${url}">
				Modifier mon adresse e-mail
			</a>
		`,
	});
}
