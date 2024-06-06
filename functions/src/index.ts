import {onRequest} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

import * as mailchimp from "@mailchimp/mailchimp_marketing";
import {defineString} from "firebase-functions/params";
import {sendEmail} from "./sendEmail";

const LIST_ID = defineString("MAILCHIMP_LIST_ID");
const API_KEY = defineString("MAILCHIMP_API_KEY");
const SERVER = defineString("MAILCHIMP_SERVER");

/**
 * Makes the call to mailchimp
 * @param {string} name The name of the lead
 * @param {string} email Their email address
 */
async function addToMailchimp(name: string, email: string) {
  mailchimp.setConfig({
    apiKey: API_KEY.value(),
    server: SERVER.value(),
  });

  try {
    const response = await mailchimp.lists.addListMember(LIST_ID.value(), {
      email_address: email,
      status: "subscribed",
      merge_fields: {
        FNAME: name,
      },
    }, {
      skipMergeValidation: true,
    });
    logger.info(response);
  } catch (e) {
    logger.error(e);
  }
}


export const addLead = onRequest(
  {cors: true},
  async (req, res) => {
    const {name, email} = req.body;
    logger.info(`Adding the following lead: ${name} ${email}`);
    await addToMailchimp(name, email);
    res.status(200).send("ok.");

    try {
      await sendEmail(email);
    } catch (e) {
      logger.error(e);
    }
  },
);
