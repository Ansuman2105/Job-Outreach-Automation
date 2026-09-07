/************************************************************
 * UAE DATA ENGINEER JOB OUTREACH AUTOMATION
 *
 * Google Apps Script + Google Sheets + Gmail
 *
 * Workflow:
 * Pending -> Initial Email -> Sent -> Follow-up 1 ->
 * Follow-up 2 -> Ignored
 *
 * If a recruiter replies at any point -> Success
 *
 * IMPORTANT:
 * - Do not commit personal email addresses or private file IDs.
 * - Configure CV_FILE_ID in this script before use.
 ************************************************************/

const SHEET_NAME = "Sheet1";

// Replace with your own Google Drive PDF CV file ID.
// Example: "YOUR_GOOGLE_DRIVE_PDF_FILE_ID"
const CV_FILE_ID = "YOUR_GOOGLE_DRIVE_PDF_FILE_ID";

const SENDER_NAME = "Your Name";

const INITIAL_EMAIL_LIMIT = 15;
const FOLLOWUP_EMAIL_LIMIT = 15;

const FOLLOWUP_1_DAYS = 4;
const FOLLOWUP_2_DAYS = 5;

const COL_NAME = 1;
const COL_EMAIL = 2;
const COL_COMPANY = 3;
const COL_JOB = 4;
const COL_STATUS = 5;
const COL_SENT_DATE = 6;
const COL_FOLLOWUP_DATE = 7;
const COL_FOLLOWUP_COUNT = 8;
const COL_THREAD_ID = 9;


// ==========================================================
// 1. SEND INITIAL EMAILS
// ==========================================================

function sendPendingEmails() {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = sheet.getDataRange().getValues();
  let sentCount = 0;

  const cvFile = DriveApp.getFileById(CV_FILE_ID);
  const pdfBlob = cvFile.getBlob()
    .setName("Data_Engineer_CV.pdf");

  for (let i = 1; i < data.length; i++) {
    if (sentCount >= INITIAL_EMAIL_LIMIT) break;

    const recruiterName = cleanValue(data[i][COL_NAME - 1]);
    const email = cleanValue(data[i][COL_EMAIL - 1]);
    const company = cleanValue(data[i][COL_COMPANY - 1]);
    const jobTitle = cleanValue(data[i][COL_JOB - 1]);
    const status = cleanValue(data[i][COL_STATUS - 1]);

    if (!email) continue;
    if (status.toLowerCase() !== "pending") continue;

    if (!isValidEmail(email)) {
      sheet.getRange(i + 1, COL_STATUS).setValue("Failed");
      continue;
    }

    const subject =
      `Application for ${jobTitle || "Data Engineer"} Opportunity – UAE`;

    const body =
`Hi ${recruiterName || "there"},

I came across the ${jobTitle || "Data Engineer"} opportunity at ${company || "your organization"} and wanted to reach out regarding the position.

I am a Data Engineer with 4 years of experience, currently based in India and actively looking for Data Engineering opportunities in the UAE.

My experience includes Azure Data Factory, ADLS, Databricks, PySpark, Python, SQL, ETL/ELT and data warehousing.

I am open to relocating to the UAE and am available for interviews immediately. I would be happy to be considered for this position or any similar Data Engineering opportunities you are currently handling.

Please find my updated CV attached for your consideration.

Thank you for your time.

Regards,
${SENDER_NAME}
Data Engineer
`;

    try {
      GmailApp.sendEmail(email, subject, body, {
        name: SENDER_NAME,
        attachments: [pdfBlob]
      });

      const now = new Date();
      const thread = findLatestSentThread(email, subject);
      const threadId = thread ? thread.getId() : "";

      sheet.getRange(i + 1, COL_STATUS).setValue("Sent");
      sheet.getRange(i + 1, COL_SENT_DATE).setValue(now);
      sheet.getRange(i + 1, COL_FOLLOWUP_DATE)
        .setValue(addDays(now, FOLLOWUP_1_DAYS));
      sheet.getRange(i + 1, COL_FOLLOWUP_COUNT).setValue(0);
      sheet.getRange(i + 1, COL_THREAD_ID).setValue(threadId);

      sentCount++;
      Logger.log("Email sent successfully to: " + email);

    } catch (error) {
      sheet.getRange(i + 1, COL_STATUS).setValue("Failed");
      Logger.log("Initial email failed for " + email + ": " + error.message);
    }
  }

  Logger.log("Initial emails sent: " + sentCount);
}


// ==========================================================
// 2. CHECK ALL REPLIES
// ==========================================================

function checkAllReplies() {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = sheet.getDataRange().getValues();
  let successCount = 0;

  for (let i = 1; i < data.length; i++) {
    const email = cleanValue(data[i][COL_EMAIL - 1]);
    const status = cleanValue(data[i][COL_STATUS - 1]);
    const threadId = cleanValue(data[i][COL_THREAD_ID - 1]);
    const sentDate = data[i][COL_SENT_DATE - 1];

    if (!email) continue;
    if (status === "Success") continue;

    if (hasRecruiterReplied(threadId, email, sentDate)) {
      markSuccess(sheet, i + 1);
      successCount++;

      Logger.log("Response detected from: " + email);
    }
  }

  Logger.log("Responses detected: " + successCount);
}


// ==========================================================
// 3. PROCESS FOLLOW-UPS
// ==========================================================

function processFollowUps() {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = sheet.getDataRange().getValues();
  const today = new Date();
  let followUpsSent = 0;

  for (let i = 1; i < data.length; i++) {
    if (followUpsSent >= FOLLOWUP_EMAIL_LIMIT) break;

    const recruiterName = cleanValue(data[i][COL_NAME - 1]);
    const email = cleanValue(data[i][COL_EMAIL - 1]);
    const company = cleanValue(data[i][COL_COMPANY - 1]);
    const jobTitle = cleanValue(data[i][COL_JOB - 1]);
    const status = cleanValue(data[i][COL_STATUS - 1]);
    const followUpDate = data[i][COL_FOLLOWUP_DATE - 1];
    const followUpCount = Number(data[i][COL_FOLLOWUP_COUNT - 1]) || 0;
    const threadId = cleanValue(data[i][COL_THREAD_ID - 1]);
    const sentDate = data[i][COL_SENT_DATE - 1];

    if (!email) continue;
    if (status !== "Sent" && status !== "Follow-up 1") continue;
    if (!followUpDate) continue;

    const dueDate = new Date(followUpDate);
    if (dueDate > today) continue;

    // Check for a reply before sending anything.
    if (hasRecruiterReplied(threadId, email, sentDate)) {
      markSuccess(sheet, i + 1);
      continue;
    }

    // Follow-up 1
    if (status === "Sent" && followUpCount === 0) {
      try {
        sendThreadFollowUp1(
          threadId, email, recruiterName, company, jobTitle
        );

        sheet.getRange(i + 1, COL_STATUS).setValue("Follow-up 1");
        sheet.getRange(i + 1, COL_FOLLOWUP_COUNT).setValue(1);
        sheet.getRange(i + 1, COL_FOLLOWUP_DATE)
          .setValue(addDays(today, FOLLOWUP_2_DAYS));

        followUpsSent++;
        Logger.log("Follow-up 1 sent to: " + email);

      } catch (error) {
        Logger.log("Follow-up 1 failed for " + email + ": " + error.message);
      }

      continue;
    }

    // Follow-up 2
    if (status === "Follow-up 1" && followUpCount === 1) {
      try {
        sendThreadFollowUp2(
          threadId, email, recruiterName, company, jobTitle
        );

        sheet.getRange(i + 1, COL_STATUS).setValue("Follow-up 2");
        sheet.getRange(i + 1, COL_FOLLOWUP_COUNT).setValue(2);
        sheet.getRange(i + 1, COL_FOLLOWUP_DATE)
          .setValue(addDays(today, FOLLOWUP_2_DAYS));

        followUpsSent++;
        Logger.log("Follow-up 2 sent to: " + email);

      } catch (error) {
        Logger.log("Follow-up 2 failed for " + email + ": " + error.message);
      }
    }
  }

  Logger.log("Follow-ups sent: " + followUpsSent);
}


// ==========================================================
// 4. FINALIZE FOLLOW-UP 2 -> IGNORED
//
// A grace period is used after Follow-up 2.
// If no reply after FOLLOWUP_2_DAYS, mark Ignored.
// ==========================================================

function finalizeIgnored() {
  const sheet = getSheet();
  ensureHeaders(sheet);

  const data = sheet.getDataRange().getValues();
  const today = new Date();
  let ignoredCount = 0;

  for (let i = 1; i < data.length; i++) {
    const status = cleanValue(data[i][COL_STATUS - 1]);
    const email = cleanValue(data[i][COL_EMAIL - 1]);
    const threadId = cleanValue(data[i][COL_THREAD_ID - 1]);
    const sentDate = data[i][COL_SENT_DATE - 1];
    const followUpDate = data[i][COL_FOLLOWUP_DATE - 1];
    const followUpCount = Number(data[i][COL_FOLLOWUP_COUNT - 1]) || 0;

    if (!email) continue;
    if (status !== "Follow-up 2" || followUpCount !== 2) continue;
    if (!followUpDate) continue;

    const dueDate = new Date(followUpDate);
    if (dueDate > today) continue;

    // One final reply check before marking Ignored.
    if (hasRecruiterReplied(threadId, email, sentDate)) {
      markSuccess(sheet, i + 1);
      continue;
    }

    sheet.getRange(i + 1, COL_STATUS).setValue("Ignored");
    sheet.getRange(i + 1, COL_FOLLOWUP_DATE).setValue("");
    ignoredCount++;

    Logger.log("Marked Ignored: " + email);
  }

  Logger.log("Rows marked Ignored: " + ignoredCount);
}


// ==========================================================
// 5. REPLY DETECTION
// ==========================================================

function hasRecruiterReplied(threadId, recruiterEmail, sentDate) {
  try {
    const recruiter = recruiterEmail.toLowerCase().trim();
    const startTime = sentDate ? new Date(sentDate).getTime() : 0;

    // Preferred: inspect the exact Gmail thread.
    if (threadId) {
      const thread = GmailApp.getThreadById(threadId);

      if (thread) {
        thread.refresh();

        const messages = thread.getMessages();

        for (let i = 0; i < messages.length; i++) {
          const message = messages[i];
          const from = extractEmail(message.getFrom());
          const messageTime = message.getDate().getTime();

          if (messageTime <= startTime) continue;

          if (from === recruiter) return true;
        }
      }
    }

    // Fallback: search Gmail for a message from the recruiter
    // after the initial outreach date.
    const threads = GmailApp.search(
      `from:${recruiter} newer_than:30d`,
      0,
      20
    );

    for (let i = 0; i < threads.length; i++) {
      const messages = threads[i].getMessages();

      for (let j = 0; j < messages.length; j++) {
        const message = messages[j];
        const from = extractEmail(message.getFrom());
        const messageTime = message.getDate().getTime();

        if (from === recruiter && messageTime > startTime) {
          return true;
        }
      }
    }

    return false;

  } catch (error) {
    Logger.log(
      "Reply detection error for " +
      recruiterEmail +
      ": " +
      error.message
    );

    return false;
  }
}


// ==========================================================
// 6. MARK SUCCESS
// ==========================================================

function markSuccess(sheet, rowNumber) {
  sheet.getRange(rowNumber, COL_STATUS).setValue("Success");
  sheet.getRange(rowNumber, COL_FOLLOWUP_DATE).setValue("");
  sheet.getRange(rowNumber, COL_FOLLOWUP_COUNT).setValue("");
}


// ==========================================================
// 7. FOLLOW-UP 1
// ==========================================================

function sendThreadFollowUp1(
  threadId,
  email,
  recruiterName,
  company,
  jobTitle
) {
  const body =
`Hi ${recruiterName || "there"},

I wanted to follow up on my previous email regarding the ${jobTitle || "Data Engineer"} opportunity at ${company || "your organization"}.

I am still very interested in Data Engineering opportunities in the UAE and would be grateful if you could consider my profile for this role or any similar openings.

I have 4 years of experience in Azure Data Engineering, including Azure Data Factory, ADLS, Databricks, PySpark, Python and SQL.

Please let me know if you would like any additional information from my side.

Regards,
${SENDER_NAME}
Data Engineer
`;

  if (threadId) {
    const thread = GmailApp.getThreadById(threadId);

    if (thread) {
      thread.reply(body, { name: SENDER_NAME });
      return;
    }
  }

  GmailApp.sendEmail(
    email,
    `Following up – ${jobTitle || "Data Engineer"} Opportunity`,
    body,
    { name: SENDER_NAME }
  );
}


// ==========================================================
// 8. FOLLOW-UP 2
// ==========================================================

function sendThreadFollowUp2(
  threadId,
  email,
  recruiterName,
  company,
  jobTitle
) {
  const body =
`Hi ${recruiterName || "there"},

I wanted to make one final follow-up regarding my previous emails about the ${jobTitle || "Data Engineer"} opportunity at ${company || "your organization"}.

I would appreciate being considered for this position or any relevant Data Engineering opportunities you may have in the UAE.

I am currently based in India, open to relocation and available for interviews.

Thank you for your time and consideration.

Regards,
${SENDER_NAME}
Data Engineer
`;

  if (threadId) {
    const thread = GmailApp.getThreadById(threadId);

    if (thread) {
      thread.reply(body, { name: SENDER_NAME });
      return;
    }
  }

  GmailApp.sendEmail(
    email,
    `Final follow-up – ${jobTitle || "Data Engineer"} Opportunity`,
    body,
    { name: SENDER_NAME }
  );
}


// ==========================================================
// 9. FIND LATEST SENT THREAD
// ==========================================================

function findLatestSentThread(email, subject) {
  try {
    const safeSubject = subject.replace(/"/g, '\\"');

    const query =
      `in:sent to:${email} subject:"${safeSubject}" newer_than:1d`;

    const threads = GmailApp.search(query, 0, 10);

    return threads.length > 0 ? threads[0] : null;

  } catch (error) {
    Logger.log(
      "Could not find sent thread for " +
      email +
      ": " +
      error.message
    );

    return null;
  }
}


// ==========================================================
// 10. CREATE DAILY TRIGGERS
//
// IMPORTANT:
// Apps Script time-based triggers are approximate.
// They do not guarantee an exact minute.
// ==========================================================

function createDailyTriggers() {
  deleteAllTriggers();

  ScriptApp.newTrigger("sendPendingEmails")
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();

  ScriptApp.newTrigger("checkAllReplies")
    .timeBased()
    .everyDays(1)
    .atHour(11)
    .create();

  ScriptApp.newTrigger("processFollowUps")
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .create();

  ScriptApp.newTrigger("finalizeIgnored")
    .timeBased()
    .everyDays(1)
    .atHour(13)
    .create();

  Logger.log("Daily automation successfully created.");
}


// ==========================================================
// 11. DELETE ALL TRIGGERS
// ==========================================================

function deleteAllTriggers() {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    ScriptApp.deleteTrigger(trigger);
  });

  Logger.log("All triggers deleted.");
}


// ==========================================================
// 12. GET SHEET
// ==========================================================

function getSheet() {
  const sheet = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error("Sheet not found: " + SHEET_NAME);
  }

  return sheet;
}


// ==========================================================
// 13. ENSURE HEADERS
// ==========================================================

function ensureHeaders(sheet) {
  const expectedHeaders = [
    "Recruiter Name",
    "Email",
    "Company",
    "Job Title",
    "Status",
    "Sent Date",
    "Follow-up Date",
    "Follow-up Count",
    "Gmail Thread ID"
  ];

  sheet
    .getRange(1, 1, 1, expectedHeaders.length)
    .setValues([expectedHeaders]);
}


// ==========================================================
// 14. HELPERS
// ==========================================================

function cleanValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function extractEmail(value) {
  if (!value) return "";

  const match = String(value).match(/<([^>]+)>/);

  if (match) {
    return match[1].trim().toLowerCase();
  }

  return String(value).trim().toLowerCase();
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
