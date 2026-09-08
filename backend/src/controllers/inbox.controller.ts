import { Request, Response } from 'express';
import { ImapService } from '../services/imap.service';
import { parseRawEmail } from '../services/ingestion.service';
import { runFullAnalysis } from '../services/analysis.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class InboxController {
  static async scanInbox(req: Request, res: Response): Promise<void> {
    try {
      const { provider, host, port, secure, email, password, maxEmails, filterType } = req.body;

      if (!host || !port || !email || !password) {
        res.status(400).json({ error: 'Missing required IMAP connection credentials' });
        return;
      }

      console.log(`Starting Inbox Scan for ${email} via ${provider || host}`);

      const emailBuffers = await ImapService.fetchAndAnalyzeSuspiciousEmails(
        {
          host,
          port: parseInt(port),
          secure: secure !== undefined ? secure : true,
          user: email,
          pass: password
        },
        {
          maxEmails: maxEmails ? parseInt(maxEmails) : 5,
          filterType: filterType || 'recent'
        }
      );

      const processedResults = [];

      for (let i = 0; i < emailBuffers.length; i++) {
        const buffer = emailBuffers[i];
        try {
          const filename = `IMAP-Auto-Fetch-${Date.now()}-${i}.eml`;
          const ingestion = await parseRawEmail(buffer);
          
          const emailDataWithFilename = {
            ...ingestion.emailData,
            filename,
          };

          const analysisResult = await runFullAnalysis(emailDataWithFilename, ingestion.parsed, ingestion.attachments, true);

          const savedEmail = await prisma.email.create({
            data: {
              filename,
              sha256Hash: ingestion.sha256Hash,
              from: emailDataWithFilename.from,
              to: emailDataWithFilename.to,
              cc: emailDataWithFilename.cc,
              subject: emailDataWithFilename.subject,
              date: emailDataWithFilename.date,
              messageId: emailDataWithFilename.messageId,
              replyTo: emailDataWithFilename.replyTo,
              returnPath: emailDataWithFilename.returnPath,
              textBodySnippet: emailDataWithFilename.textBodySnippet,
              htmlBodyExists: emailDataWithFilename.htmlBodyExists,
              attachmentCount: emailDataWithFilename.attachmentCount,
              receivedHeaders: emailDataWithFilename.receivedHeaders,
              spfResult: ingestion.spfResult,
              dkimResult: ingestion.dkimResult,
              dmarcResult: ingestion.dmarcResult,
              analysisReport: {
                create: {
                  threatLevel: analysisResult.threatLevel,
                  riskScore: analysisResult.riskEvaluation?.score || 0,
                  severity: analysisResult.riskEvaluation?.severity || 'LOW',
                  summary: analysisResult.riskEvaluation?.summary || '',
                  anomalies: analysisResult.anomalies as any,
                  riskFactors: (analysisResult.riskEvaluation?.factors || []) as any,
                  domainAnalysis: (analysisResult.domainAnalysis || {}) as any,
                  urlAnalysis: (analysisResult.urlAnalysis || []) as any,
                  routeAnalysis: (analysisResult.routeAnalysis || {}) as any,
                  threatIntel: (analysisResult.threatIntel || []) as any,
                  attachments: (ingestion.attachments || []) as any,
                  nlpAnalysis: (analysisResult.nlpAnalysis || {}) as any,
                  aiAnalysis: (analysisResult.aiAnalysis || {}) as any,
                }
              }
            },
            include: {
              analysisReport: true
            }
          });

          processedResults.push({
            data: savedEmail,
            analysis: analysisResult
          });
        } catch (err: any) {
          console.error('Error processing IMAP buffer:', err);
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully scanned and analyzed ${processedResults.length} emails.`,
        data: processedResults
      });
    } catch (error: any) {
      console.error('Inbox scan failed:', error);
      res.status(500).json({ error: error.message || 'Failed to scan inbox' });
    }
  }
}
