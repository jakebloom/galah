import * as admin from 'firebase-admin';
import {Auth, google} from 'googleapis';
import { defineString } from 'firebase-functions/params';
import * as logger from "firebase-functions/logger";
import { ATTACHMENT } from './attachment';

admin.initializeApp();

const OAUTH_CLIENT_ID = defineString("OAUTH_CLIENT_ID");
const OAUTH_CLIENT_SECRET = defineString("OAUTH_CLIENT_SECRET");
const CREDENTIALS_BUCKET_NAME = defineString("CREDENTIALS_BUCKET_NAME");
const CREDENTIALS_FILE_NAME = defineString("CREDENTIALS_FILE_NAME");

async function getOAuthClient(): Promise<Auth.OAuth2Client> {
  const oauth2Client = new google.auth.OAuth2({
    clientId: OAUTH_CLIENT_ID.value(),
    clientSecret: OAUTH_CLIENT_SECRET.value(),
  });

  const file = admin.storage().bucket(CREDENTIALS_BUCKET_NAME.value()).file(CREDENTIALS_FILE_NAME.value());
  const [content] = await file.download();
  const loadedCredentials = JSON.parse(content.toString());
  oauth2Client.setCredentials(loadedCredentials);

  if (oauth2Client.credentials.expiry_date && oauth2Client.credentials.expiry_date < (new Date().valueOf())) {
    logger.info("Refreshing OAuth client credentials");
    const res = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(res.credentials);
    const newCredentials = JSON.stringify(res.credentials)
    file.save(newCredentials, {contentType: "application/json"});
  }

  return oauth2Client;
}

export async function sendEmail(email: string) {
  logger.info(`Sending email to ${email}`);
  const oauth2Client = await getOAuthClient();

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const emailLines = [
    'From: "Jake @ Galah Labs" <jake@galah.lol>',
    `To: ${email}`,
    'Subject: Your Free Report From Galah Labs',
    'MIME-Version: 1.0',
    'Content-Type: multipart/mixed; boundary="content_boundary"',
    '',
    '--content_boundary',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    'Hi 👋 Jake here.\n',
    'Thanks for signing up to get our report detailing the best performing video ads on the internet!\n',
    'If you have any questions or feedback, please feel free to reply and ask away!\n',
    'Enjoy,\nJake Bloom\nFounder\nGalah Labs LLC',
    '',
    '--content_boundary',
    'Content-Type: application/pdf; name="The Top Video Ads.pdf"',
    'Content-Transfer-Encoding: base64',
    'Content-Disposition: attachment; filename="The Top Video Ads.pdf"',
    '',
    ATTACHMENT,
    '',
    '--content_boundary--',
  ];

  const emailBody = emailLines.join('\n');

  const encodedMessage = Buffer.from(emailBody)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
            raw: encodedMessage
        }
    });
    logger.info('Email sent successfully:', result.data);
  } catch (error) {
    logger.error('Error sending email:', error);
  }
}
