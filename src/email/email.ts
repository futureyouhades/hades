import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

import type {
  AgentTask,
  AgentResult,
  HadesAgent,
} from "../agents/core/index.js";

export interface EmailMessage {
  uid: number;
  from: string;
  subject: string;
  text: string;
  date: Date;
}

export class EmailAgent implements HadesAgent {
  readonly name = "email";

  readonly description = "Email Agent";

  private client = new ImapFlow({
    host: process.env.IMAP_HOST!,
    port: Number(process.env.IMAP_PORT ?? 993),
    secure: true,
    auth: {
      user: process.env.EMAIL_USERNAME!,
      pass: process.env.EMAIL_PASSWORD!,
    },
  });

  canHandle(task: AgentTask): boolean {
    return task.type === "email";
  }

  async execute(task: AgentTask): Promise<AgentResult> {
    try {
      await this.connect();

      const emails = await this.getLatest(
        Number(task.context?.limit ?? 10)
      );

      return {
        success: true,
        agent: this.name,
        output: emails,
      };
    } finally {
      // disconnect nie może zamaskować oryginalnego błędu połączenia/pobierania
      await this.disconnect().catch(() => {});
    }
  }

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
