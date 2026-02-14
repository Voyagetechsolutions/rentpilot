import { Resend } from 'resend';

export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface SMSOptions {
    to: string;
    message: string;
}

// Initialize Resend client (lazy — only when API key is present)
let resendClient: Resend | null = null;

function getResendClient(): Resend | null {
    if (!process.env.RESEND_API_KEY) return null;
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'RentPilot <onboarding@resend.dev>';

export const notifications = {
    sendEmail: async ({ to, subject, html }: EmailOptions) => {
        const client = getResendClient();

        if (!client) {
            // Fallback to console log in development / when no API key
            console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
            console.log(`[CONTENT] ${html.substring(0, 100)}...`);
            return { success: true, mock: true };
        }

        try {
            const { data, error } = await client.emails.send({
                from: FROM_EMAIL,
                to: [to],
                subject,
                html,
            });

            if (error) {
                console.error('[EMAIL ERROR]', error);
                return { success: false, error: error.message };
            }

            console.log(`[EMAIL SENT] To: ${to} | ID: ${data?.id}`);
            return { success: true, id: data?.id };
        } catch (err) {
            console.error('[EMAIL EXCEPTION]', err);
            return { success: false, error: String(err) };
        }
    },

    sendSMS: async ({ to, message }: SMSOptions) => {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        // Integration point for Twilio/SNS
        return { success: true };
    }
};
