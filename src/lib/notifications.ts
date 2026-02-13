export interface EmailOptions {
    to: string;
    subject: string;
    html: string;
}

export interface SMSOptions {
    to: string;
    message: string;
}

export const notifications = {
    sendEmail: async ({ to, subject, html }: EmailOptions) => {
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
        console.log(`[CONTENT] ${html.substring(0, 100)}...`);
        // Integration point for Resend/SendGrid
        // if (process.env.RESEND_API_KEY) { ... }
        return { success: true };
    },

    sendSMS: async ({ to, message }: SMSOptions) => {
        console.log(`[MOCK SMS] To: ${to} | Message: ${message}`);
        // Integration point for Twilio/SNS
        return { success: true };
    }
};
