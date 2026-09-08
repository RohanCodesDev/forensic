import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { runFullAnalysis } from '../services/analysis.service';
import { parseRawEmail } from '../services/ingestion.service';

const prisma = new PrismaClient();

export const simulateAttack = async (req: Request, res: Response): Promise<void> => {
  try {
    const { spoofedSender, maliciousAttachment, foreignRouting, socialEngineering } = req.body;

    const date = new Date().toUTCString();

    // 1. Forge Headers
    let fromHeader = 'From: "System Admin" <admin@local.test>';
    let returnPath = 'Return-Path: <admin@local.test>';
    
    if (spoofedSender) {
      fromHeader = 'From: "CEO John Doe" <ceo@yourcompany.com>';
      returnPath = 'Return-Path: <attacker_8892@yandex.ru>';
    }

    // 2. Forge Routing
    let receivedHeaders = `Received: from local.test (local.test [127.0.0.1])
\tby mx.local.test with SMTP id 12345
\tfor <user@local.test>; ${date}`;

    if (foreignRouting) {
      // Simulate hop through a known high-risk region (e.g. Russian IP block)
      receivedHeaders = `Received: from mail.yourcompany.com (mail.yourcompany.com [198.51.100.2])
\tby mx.yourcompany.com with ESMTP id 98765
\tfor <employee@yourcompany.com>; ${date}
Received: from unknown (HELO evil.mailer) (95.173.136.70)
\tby mail.yourcompany.com with SMTP id 12345
\tfor <employee@yourcompany.com>; ${date}`;
    }

    // 3. Forge Body & URLs
    let subject = 'Weekly Status Report';
    let body = 'Please find the weekly status report attached.\n\nThanks,\nAdmin';

    if (socialEngineering) {
      subject = 'URGENT: Confidential Wire Transfer & Account Security Update Required Immediately';
      body = `I am currently in a highly confidential meeting and cannot take calls.
      
We need to finalize the acquisition immediately. Please process an urgent wire transfer of $45,000 to the attached account details. This is extremely time-sensitive. Do not discuss this with anyone else until I give the clear.

Also, IT notified me of a security breach. You must immediately verify your corporate credentials here: 
http://secure-login.update-baddomain.com/auth/login.php

And download the latest security patch directly from our external server:
http://192.168.1.200/payload_patch.exe

Let me know the moment it is done.

Regards,
CEO`;
    }

    // Explicit Authentication Failures (SPF/DKIM/DMARC)
    let authResults = `Authentication-Results: mx.local.test;
\tspf=pass smtp.mailfrom=admin@local.test;
\tdkim=pass header.i=@local.test;
\tdmarc=pass (p=none sp=none dis=none) header.from=local.test`;

    if (spoofedSender) {
      authResults = `Authentication-Results: mx.yourcompany.com;
\tspf=fail (sender IP is 95.173.136.70, not permitted by SPF record) smtp.mailfrom=attacker_8892@yandex.ru;
\tdkim=fail (signature did not verify) header.i=@yourcompany.com;
\tdmarc=fail (p=reject sp=reject dis=reject) header.from=yourcompany.com`;
    }

    // 4. Forge Attachment
    let boundary = '----=_Part_12345_67890';
    let mimeMessage = `${receivedHeaders}
${authResults}
Date: ${date}
${fromHeader}
To: "Employee" <employee@yourcompany.com>
${returnPath}
Message-ID: <${Date.now()}@mock.mail>
Subject: ${subject}
MIME-Version: 1.0
Content-Type: multipart/mixed; boundary="${boundary}"

--${boundary}
Content-Type: text/plain; charset=UTF-8
Content-Transfer-Encoding: 7bit

${body}
`;

    if (maliciousAttachment) {
      // Add a fake executable payload
      mimeMessage += `
--${boundary}
Content-Type: application/x-msdownload; name="Wire_Transfer_Details.exe"
Content-Transfer-Encoding: base64
Content-Disposition: attachment; filename="Wire_Transfer_Details.exe"

TVqQAAMAAAAEAAAA//8AALgAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA
AAAAAAAAAAAAAAA=
`;
    }

    mimeMessage += `\n--${boundary}--`;

    const emailBuffer = Buffer.from(mimeMessage, 'utf-8');

    // Parse the generated buffer just like a real email
    const ingestion = await parseRawEmail(emailBuffer);
    
    const emailDataWithFilename = {
      ...ingestion.emailData,
      filename: `SIMULATED_ATTACK_${Date.now()}.eml`,
    };

    // Skip true AI analysis for the simulator to save Groq rate limits, unless NLP is triggered
    const skipAiAnalysis = !socialEngineering;
    const analysisResult = await runFullAnalysis(emailDataWithFilename, ingestion.parsed, ingestion.attachments, skipAiAnalysis);

    // Save to DB
    const savedEmail = await prisma.email.create({
      data: {
        filename: emailDataWithFilename.filename,
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

    res.json({
      status: 'success',
      message: 'Simulated attack injected successfully.',
      data: savedEmail,
      analysis: analysisResult
    });
  } catch (error: any) {
    console.error('Simulator error:', error);
    res.status(500).json({ status: 'error', message: 'Simulator failed: ' + error.message });
  }
};
