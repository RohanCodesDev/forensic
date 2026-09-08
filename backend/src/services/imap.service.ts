import { ImapFlow } from 'imapflow';


export interface ImapConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
}

export interface ScanOptions {
  maxEmails?: number;
  filterType?: 'unread' | 'recent' | 'all';
}

export class ImapService {
  /**
   * Connects to IMAP, searches the inbox, and streams raw .eml buffers.
   */
  static async fetchAndAnalyzeSuspiciousEmails(
    config: ImapConfig,
    options: ScanOptions
  ): Promise<any[]> {
    console.log(`Initiating IMAP connection to ${config.host} for ${config.user}...`);
    
    const client = new ImapFlow({
      host: config.host,
      port: config.port,
      secure: config.secure,
      tls: config.secure ? { rejectUnauthorized: false } : undefined,
      auth: {
        user: config.user,
        pass: config.pass.replace(/\s+/g, '') // Strip spaces just in case
      },
      logger: false // Disable verbose imapflow logs
    });

    const results: Buffer[] = [];

    try {
      await client.connect();
      console.log('IMAP connection successful.');

      // Select INBOX
      const lock = await client.getMailboxLock('INBOX');
      try {
        // Build search criteria
        let searchCriteria: any = {};
        if (options.filterType === 'unread') {
          searchCriteria = { seen: false };
        } else if (options.filterType === 'recent') {
          searchCriteria = { since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }; // Last 7 days
        } else {
          searchCriteria = { all: true };
        }

        // Search for emails
        const messages: number[] = (await client.search(searchCriteria, { uid: true })) as any;
        console.log(`Found ${messages ? messages.length : 0} messages matching criteria.`);

        if (!messages || messages.length === 0) {
          return [];
        }

        // Limit the number of emails to process
        const maxEmails = options.maxEmails || 10;
        // Take the latest ones (end of the array)
        const uidsToProcess = messages.slice(-maxEmails);

        console.log(`Processing ${uidsToProcess.length} emails...`);

        // Fetch the raw source for each selected UID
        for (const uid of uidsToProcess) {
          try {
            const messageData = await client.fetchOne(uid, { source: true }, { uid: true });
            if (messageData && messageData.source) {
              const emailBuffer = messageData.source;
              console.log(`Fetched raw buffer for UID ${uid} (${emailBuffer.length} bytes).`);
              results.push(emailBuffer);
            }
          } catch (fetchError) {
            console.error(`Error fetching UID ${uid}:`, fetchError);
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error('IMAP Error:', err);
      throw new Error(`IMAP Connection Failed: ${(err as Error).message}`);
    } finally {
      await client.logout();
      console.log('IMAP session closed.');
    }

    return results;
  }
}
