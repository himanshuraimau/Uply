import nodemailer from 'nodemailer';

interface AlertContext {
    websiteUrl: string;
    websiteId: string;
    status: 'UP' | 'DOWN';
    responseTime: number;
    timestamp: string;
}

export async function sendAlert(email: string, context: AlertContext) {
    if (!email) {
        console.log('⚠️ No email provided for alert, skipping.');
        return;
    }

    // Check if SMTP credentials are provided
    const hasCredentials = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

    if (!hasCredentials) {
        // Mock mode: Log the email that would have been sent
        console.log('🔔 [MOCK EMAIL] To:', email);
        console.log('Subject:', `[UPLY] Alert: ${context.websiteUrl} is ${context.status}`);
        console.log('Body:', `
            Your website ${context.websiteUrl} is now ${context.status}.
            Response time: ${context.responseTime}ms
            Time: ${context.timestamp}
        `);
        return;
    }

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });

        const subject = context.status === 'DOWN'
            ? `🔴 Alert: ${context.websiteUrl} is DOWN`
            : `🟢 Recovery: ${context.websiteUrl} is UP`;

        const color = context.status === 'DOWN' ? '#ef4444' : '#22c55e';
        const actionText = context.status === 'DOWN' ? 'is currently down' : 'is back online';

        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <h1 style="color: ${color}; margin-bottom: 20px;">Website ${context.status}</h1>
                <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
                    Your monitored website <strong>${context.websiteUrl}</strong> ${actionText}.
                </p>

                <div style="background-color: #f3f4f6; padding: 16px; border-radius: 4px; margin-bottom: 24px;">
                    <p style="margin: 0; margin-bottom: 8px;"><strong>URL:</strong> <a href="${context.websiteUrl}">${context.websiteUrl}</a></p>
                    <p style="margin: 0; margin-bottom: 8px;"><strong>Status:</strong> <span style="color: ${color}; font-weight: bold;">${context.status}</span></p>
                    <p style="margin: 0; margin-bottom: 8px;"><strong>Response Time:</strong> ${context.responseTime}ms</p>
                    <p style="margin: 0;"><strong>Time:</strong> ${context.timestamp}</p>
                </div>

                <p style="font-size: 14px; color: #6b7280; margin-top: 40px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                    Sent by UPLY Monitoring System
                </p>
            </div>
        `;

        await transporter.sendMail({
            from: process.env.SMTP_FROM || '"UPLY Alerts" <alerts@uply.com>',
            to: email,
            subject,
            html,
        });

        console.log(`✅ Alert email sent to ${email} for ${context.websiteUrl} (${context.status})`);
    } catch (error) {
        console.error('❌ Failed to send alert email:', error);
    }
}
