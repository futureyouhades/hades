import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export interface EmailMessage {
  uid: number;
  from: string;
  subject: string;
  text: string;
  date: Date;
}

export class EmailAgent {
  private client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME!,
      pass: process.env.EMAIL_PASSWORD!,
    },
  });

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.logout();
  }

  async getLatest(limit = 10): Promise<EmailMessage[]> {
    const mailbox = await this.client.mailboxOpen("INBOX");

    const start = Math.max(1, mailbox.exists - limit + 1);

    const messages: EmailMessage[] = [];

    for await (const msg of this.client.fetch(
      { seq: `${start}:*` },
      { source: true, uid: true }
    )) {
      const parsed = await simpleParser(msg.source!);

      messages.push({
        uid: msg.uid,
        from: parsed.from?.text ?? "",
        subject: parsed.subject ?? "",
        text: parsed.text ?? "",
        date: parsed.date ?? new Date(),
      });
    }

    return messages.reverse();
  }
}
