import { z } from "zod";

export const bookingSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your name.")
    .max(100, "Name is too long."),
  email: z.email("Please enter a valid email address."),
  instagram: z
    .string()
    .trim()
    .min(2, "Please enter your Instagram handle.")
    .max(100, "Instagram handle is too long."),
});

export type BookingPayload = z.infer<typeof bookingSchema>;

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export async function sendBookingEmail(payload: BookingPayload) {
  const resendApiKey = getRequiredEnv("RESEND_API_KEY");
  const bookingEmailTo = getRequiredEnv("BOOKING_EMAIL_TO");
  const { Resend } = await import("resend");
  const resend = new Resend(resendApiKey);

  return resend.emails.send({
    from: "Photo Day <onboarding@resend.dev>",
    to: [bookingEmailTo],
    subject: `New Pastel Muse contact: ${payload.name}`,
    text: [
      "New contact request",
      "",
      `Name: ${payload.name}`,
      `Email: ${payload.email}`,
      `Instagram: ${payload.instagram}`,
    ].join("\n"),
  });
}

export async function sendBookingTelegram(payload: BookingPayload) {
  const botToken = getRequiredEnv("TELEGRAM_BOT_TOKEN");
  const chatId = getRequiredEnv("TELEGRAM_CHAT_ID");

  const text = [
    "New contact request",
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Instagram: ${payload.instagram}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Telegram delivery failed.");
  }

  return response.json();
}
