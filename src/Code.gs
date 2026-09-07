/************************************************************
 * GLOBAL JOB OUTREACH AUTOMATION
 *
 * Google Apps Script + Google Sheets + Gmail + Google Drive
 *
 * Workflow:
 *
 * Pending
 *    ↓
 * Initial Email + CV
 *    ↓
 * Sent
 *    ↓
 * Follow-up 1
 *    ↓
 * Follow-up 2
 *    ↓
 * No response → Ignored
 *
 * Recruiter replies at ANY stage → Success
 *
 * IMPORTANT:
 * - Keep recruiter email addresses in Column B.
 * - Keep your CV in Google Drive.
 * - Do NOT publish your CV ID or personal data on GitHub.
 ************************************************************/


// ==========================================================
// CONFIGURATION
// ==========================================================

const SHEET_NAME = "Sheet1";

// Your Google Drive PDF CV file ID
const CV_FILE_ID = "16N0SB26PfPSM-OiT08tNbGtLc21dXCR1";

// Name shown in outgoing emails
const SENDER_NAME = "Ansuman Nayak";


// ----------------------------------------------------------
// Daily sending limits
// ----------------------------------------------------------

const INITIAL_EMAIL_LIMIT = 15;
const FOLLOWUP_EMAIL_LIMIT = 15;


// ----------------------------------------------------------
// Follow-up timing
// ----------------------------------------------------------

// Follow-up 1 after initial email
const FOLLOWUP_1_DAYS = 4;

// Follow-up 2 after Follow-up 1
const FOLLOWUP_2_DAYS = 5;

// After Follow-up 2, wait this many days before Ignored
const IGNORE_AFTER_FOLLOWUP_2_DAYS = 5;


// ==========================================================
// GOOGLE SHEET COLUMNS
// ==========================================================

const COL_NAME = 1;          // A
const COL_EMAIL = 2;         // B
const COL_COMPANY = 3;       // C
const COL_JOB = 4;           // D
const COL_STATUS = 5;        // E
const COL_SENT_DATE = 6;     // F
const COL_FOLLOWUP_DATE = 7; // G
const COL_FOLLOWUP_COUNT = 8;// H
const COL_THREAD_ID = 9;     // I


// ==========================================================
// 1. SEND INITIAL EMAILS
// ==========================================================

function sendPendingEmails() {

  const sheet = getSheet();

  ensureHeaders(sheet);

  const data = sheet.getDataRange().getValues();

  let sentCount = 0;


  // --------------------------------------------------------
  // Get CV
  // --------------------------------------------------------

  let pdfBlob;

  try {

    const cvFile = DriveApp.getFileById(CV_FILE_ID);

    pdfBlob = cvFile
      .getBlob()
      .setName("CV.pdf");

  } catch (error) {

    Logger.log(
      "Unable to access CV: " + error.message
    );

    throw new Error(
      "CV file could not be accessed. Check CV_FILE_ID."
    );
  }


  // --------------------------------------------------------
  // Process rows
  // --------------------------------------------------------

  for (let i = 1; i < data.length; i++) {

    if (sentCount >= INITIAL_EMAIL_LIMIT) {
      break;
    }


    const recruiterName =
      cleanValue(data[i][COL_NAME - 1]);

    const email =
      cleanValue(data[i][COL_EMAIL - 1]);

    const company =
      cleanValue(data[i][COL_COMPANY - 1]);

    const jobTitle =
      cleanValue(data[i][COL_JOB - 1]);

    const status =
      cleanValue(data[i][COL_STATUS - 1]);


    // ------------------------------------------------------
    // Skip empty rows
    // ------------------------------------------------------

    if (!email) {
      continue;
    }


    // ------------------------------------------------------
    // Only Pending rows
    // ------------------------------------------------------

    if (status.toLowerCase() !== "pending") {
      continue;
    }


    // ------------------------------------------------------
    // Validate email
    // ------------------------------------------------------

    if (!isValidEmail(email)) {

      sheet
        .getRange(i + 1, COL_STATUS)
        .setValue("Failed");

      Logger.log(
        "Invalid email: " + email
      );

      continue;
    }


    // ------------------------------------------------------
    // Subject
    // ------------------------------------------------------

    const subject =
      `${jobTitle || "Job"} | 4 Years Experience | Global Opportunities`;


    // ------------------------------------------------------
    // Initial Email Body
    // ------------------------------------------------------

    const body =
`Hi ${recruiterName || "there"},

I’m reaching out regarding the ${jobTitle || "opportunity"} at ${company || "your organization"}.

I’m a professional with 4 years of experience working with Azure Data Factory, ADLS, Databricks, PySpark, Python, SQL, ETL/ELT, and data warehousing.

I’m currently based in India and actively exploring international opportunities. I’m open to relocation and available for interviews at short notice.

I’ve attached my latest CV for your consideration. If you’re currently hiring for this position or have similar opportunities that match my profile, I’d appreciate the opportunity to connect.

Thank you for your time.

Best regards,
${SENDER_NAME}
`;


    // ------------------------------------------------------
    // SEND INITIAL EMAIL
    // ------------------------------------------------------

    try {

      GmailApp.sendEmail(
        email,
        subject,
        body,
        {
          name: SENDER_NAME,
          attachments: [pdfBlob]
        }
      );


      // ----------------------------------------------------
      // Find Gmail thread
      // ----------------------------------------------------

      const thread =
        findLatestSentThread(
          email,
          subject
        );


      const threadId =
        thread
          ? thread.getId()
          : "";


      // ----------------------------------------------------
      // Update Sheet
      // ----------------------------------------------------

      const now = new Date();


      sheet
        .getRange(i + 1, COL_STATUS)
        .setValue("Sent");


      sheet
        .getRange(i + 1, COL_SENT_DATE)
        .setValue(now);


      sheet
        .getRange(i + 1, COL_FOLLOWUP_DATE)
        .setValue(
          addDays(
            now,
            FOLLOWUP_1_DAYS
          )
        );


      sheet
        .getRange(i + 1, COL_FOLLOWUP_COUNT)
        .setValue(0);


      sheet
        .getRange(i + 1, COL_THREAD_ID)
        .setValue(threadId);


      sentCount++;


      Logger.log(
        "Initial email sent to: " + email
      );


    } catch (error) {

      sheet
        .getRange(i + 1, COL_STATUS)
        .setValue("Failed");


      Logger.log(
        "Initial email failed for " +
        email +
        ": " +
        error.message
      );
    }
  }


  Logger.log(
    "Initial emails sent: " +
    sentCount
  );
}


// ==========================================================
// 2. CHECK ALL REPLIES
// ==========================================================

function checkAllReplies() {

  const sheet = getSheet();

  ensureHeaders(sheet);

  const data =
    sheet.getDataRange().getValues();

  let successCount = 0;


  for (let i = 1; i < data.length; i++) {

    const email =
      cleanValue(
        data[i][COL_EMAIL - 1]
      );

    const status =
      cleanValue(
        data[i][COL_STATUS - 1]
      );

    const threadId =
      cleanValue(
        data[i][COL_THREAD_ID - 1]
      );

    const sentDate =
      data[i][COL_SENT_DATE - 1];


    if (!email) {
      continue;
    }


    // Already successful
    if (
      status.toLowerCase() ===
      "success"
    ) {
      continue;
    }


    try {

      if (
        hasRecruiterReplied(
          threadId,
          email,
          sentDate
        )
      ) {

        markSuccess(
          sheet,
          i + 1
        );

        successCount++;


        Logger.log(
          "Response detected from: " +
          email
        );
      }

    } catch (error) {

      Logger.log(
        "Reply check failed for " +
        email +
        ": " +
        error.message
      );
    }
  }


  Logger.log(
    "Responses detected: " +
    successCount
  );
}


// ==========================================================
// 3. PROCESS FOLLOW-UPS
// ==========================================================

function processFollowUps() {

  const sheet = getSheet();

  ensureHeaders(sheet);

  const data =
    sheet.getDataRange().getValues();

  const today =
    new Date();

  let followUpsSent = 0;


  for (let i = 1; i < data.length; i++) {

    if (
      followUpsSent >=
      FOLLOWUP_EMAIL_LIMIT
    ) {
      break;
    }


    const recruiterName =
      cleanValue(
        data[i][COL_NAME - 1]
      );

    const email =
      cleanValue(
        data[i][COL_EMAIL - 1]
      );

    const company =
      cleanValue(
        data[i][COL_COMPANY - 1]
      );

    const jobTitle =
      cleanValue(
        data[i][COL_JOB - 1]
      );

    const status =
      cleanValue(
        data[i][COL_STATUS - 1]
      );

    const followUpDate =
      data[i][COL_FOLLOWUP_DATE - 1];

    const followUpCount =
      Number(
        data[i][COL_FOLLOWUP_COUNT - 1]
      ) || 0;

    const threadId =
      cleanValue(
        data[i][COL_THREAD_ID - 1]
      );

    const sentDate =
      data[i][COL_SENT_DATE - 1];


    if (!email) {
      continue;
    }


    // ------------------------------------------------------
    // Only these statuses are handled here
    // ------------------------------------------------------

    if (
      status !== "Sent" &&
      status !== "Follow-up 1"
    ) {
      continue;
    }


    if (!followUpDate) {
      continue;
    }


    const dueDate =
      new Date(followUpDate);


    if (dueDate > today) {
      continue;
    }


    // ------------------------------------------------------
    // ALWAYS CHECK FOR REPLY BEFORE FOLLOW-UP
    // ------------------------------------------------------

    if (
      hasRecruiterReplied(
        threadId,
        email,
        sentDate
      )
    ) {

      markSuccess(
        sheet,
        i + 1
      );

      continue;
    }


    // ======================================================
    // FOLLOW-UP 1
    // ======================================================

    if (
      status === "Sent" &&
      followUpCount === 0
    ) {

      try {

        sendThreadFollowUp1(
          threadId,
          email,
          recruiterName,
          company,
          jobTitle
        );


        sheet
          .getRange(
            i + 1,
            COL_STATUS
          )
          .setValue("Follow-up 1");


        sheet
          .getRange(
            i + 1,
            COL_FOLLOWUP_COUNT
          )
          .setValue(1);


        sheet
          .getRange(
            i + 1,
            COL_FOLLOWUP_DATE
          )
          .setValue(
            addDays(
              today,
              FOLLOWUP_2_DAYS
            )
          );


        followUpsSent++;


        Logger.log(
          "Follow-up 1 sent explicitly to: " +
          email
        );


      } catch (error) {

        Logger.log(
          "Follow-up 1 failed for " +
          email +
          ": " +
          error.message
        );
      }


      continue;
    }


    // ======================================================
    // FOLLOW-UP 2
    // ======================================================

    if (
      status === "Follow-up 1" &&
      followUpCount === 1
    ) {

      try {

        sendThreadFollowUp2(
          threadId,
          email,
          recruiterName,
          company,
          jobTitle
        );


        sheet
          .getRange(
            i + 1,
            COL_STATUS
          )
          .setValue("Follow-up 2");


        sheet
          .getRange(
            i + 1,
            COL_FOLLOWUP_COUNT
          )
          .setValue(2);


        sheet
          .getRange(
            i + 1,
            COL_FOLLOWUP_DATE
          )
          .setValue(
            addDays(
              today,
              IGNORE_AFTER_FOLLOWUP_2_DAYS
            )
          );


        followUpsSent++;


        Logger.log(
          "Follow-up 2 sent explicitly to: " +
          email
        );


      } catch (error) {

        Logger.log(
          "Follow-up 2 failed for " +
          email +
          ": " +
          error.message
        );
      }
    }
  }


  Logger.log(
    "Follow-ups sent: " +
    followUpsSent
  );
}


// ==========================================================
// 4. FINALIZE IGNORED
// ==========================================================

function finalizeIgnored() {

  const sheet = getSheet();

  ensureHeaders(sheet);

  const data =
    sheet.getDataRange().getValues();

  const today =
    new Date();

  let ignoredCount = 0;


  for (let i = 1; i < data.length; i++) {

    const status =
      cleanValue(
        data[i][COL_STATUS - 1]
      );

    const email =
      cleanValue(
        data[i][COL_EMAIL - 1]
      );

    const threadId =
      cleanValue(
        data[i][COL_THREAD_ID - 1]
      );

    const sentDate =
      data[i][COL_SENT_DATE - 1];

    const followUpDate =
      data[i][COL_FOLLOWUP_DATE - 1];

    const followUpCount =
      Number(
        data[i][COL_FOLLOWUP_COUNT - 1]
      ) || 0;


    if (!email) {
      continue;
    }


    if (
      status !== "Follow-up 2" ||
      followUpCount !== 2
    ) {
      continue;
    }


    if (!followUpDate) {
      continue;
    }


    const dueDate =
      new Date(followUpDate);


    if (dueDate > today) {
      continue;
    }


    // ------------------------------------------------------
    // FINAL RESPONSE CHECK
    // ------------------------------------------------------

    if (
      hasRecruiterReplied(
        threadId,
        email,
        sentDate
      )
    ) {

      markSuccess(
        sheet,
        i + 1
      );

      continue;
    }


    // ------------------------------------------------------
    // NO RESPONSE → IGNORED
    // ------------------------------------------------------

    sheet
      .getRange(
        i + 1,
        COL_STATUS
      )
      .setValue("Ignored");


    sheet
      .getRange(
        i + 1,
        COL_FOLLOWUP_DATE
      )
      .setValue("");


    ignoredCount++;


    Logger.log(
      "Marked Ignored: " +
      email
    );
  }


  Logger.log(
    "Rows marked Ignored: " +
    ignoredCount
  );
}


// ==========================================================
// 5. REPLY DETECTION
// ==========================================================

function hasRecruiterReplied(
  threadId,
  recruiterEmail,
  sentDate
) {

  try {

    const recruiter =
      recruiterEmail
        .toLowerCase()
        .trim();


    const startTime =
      sentDate
        ? new Date(sentDate).getTime()
        : 0;


    // ======================================================
    // METHOD 1
    // Check stored Gmail thread
    // ======================================================

    if (threadId) {

      try {

        const thread =
          GmailApp.getThreadById(
            threadId
          );


        if (thread) {

          const messages =
            thread.getMessages();


          for (
            let i = 0;
            i < messages.length;
            i++
          ) {

            const message =
              messages[i];


            const from =
              extractEmail(
                message.getFrom()
              );


            const messageTime =
              message
                .getDate()
                .getTime();


            if (
              messageTime <=
              startTime
            ) {
              continue;
            }


            if (
              from === recruiter
            ) {
              return true;
            }
          }
        }

      } catch (threadError) {

        Logger.log(
          "Thread lookup failed for " +
          recruiterEmail +
          ": " +
          threadError.message
        );
      }
    }


    // ======================================================
    // METHOD 2
    // Gmail search fallback
    // ======================================================

    const threads =
      GmailApp.search(
        `from:${recruiter} newer_than:30d`,
        0,
        20
      );


    for (
      let i = 0;
      i < threads.length;
      i++
    ) {

      const messages =
        threads[i].getMessages();


      for (
        let j = 0;
        j < messages.length;
        j++
      ) {

        const message =
          messages[j];


        const from =
          extractEmail(
            message.getFrom()
          );


        const messageTime =
          message
            .getDate()
            .getTime();


        if (
          from === recruiter &&
          messageTime > startTime
        ) {

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

function markSuccess(
  sheet,
  rowNumber
) {

  sheet
    .getRange(
      rowNumber,
      COL_STATUS
    )
    .setValue("Success");


  sheet
    .getRange(
      rowNumber,
      COL_FOLLOWUP_DATE
    )
    .setValue("");


  sheet
    .getRange(
      rowNumber,
      COL_FOLLOWUP_COUNT
    )
    .setValue("");


  Logger.log(
    "Marked Success - Row: " +
    rowNumber
  );
}


// ==========================================================
// 7. FOLLOW-UP 1
//
// IMPORTANT:
// We intentionally use GmailApp.sendEmail()
// instead of thread.reply().
//
// This guarantees that the email goes to the
// recruiter address stored in Column B.
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

I wanted to follow up on my previous email regarding the ${jobTitle || "opportunity"} at ${company || "your organization"}.

I would appreciate it if you could let me know whether my profile is suitable for the position or any similar openings.

Thank you for your time.

Best regards,
${SENDER_NAME}
`;


  const subject =
    `Following up – ${jobTitle || "Opportunity"}`;


  // --------------------------------------------------------
  // IMPORTANT:
  // Explicitly use the email from Column B.
  // --------------------------------------------------------

  GmailApp.sendEmail(
    email,
    subject,
    body,
    {
      name: SENDER_NAME
    }
  );


  Logger.log(
    "Follow-up 1 recipient: " +
    email
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

Just following up once more regarding my application for the ${jobTitle || "opportunity"} at ${company || "your organization"}.

Please let me know if there are any relevant opportunities that match my profile. I’d be happy to connect.

Thank you for your consideration.

Best regards,
${SENDER_NAME}
`;


  const subject =
    `Final Follow-up – ${jobTitle || "Opportunity"}`;


  // --------------------------------------------------------
  // IMPORTANT:
  // Explicitly use the email from Column B.
  // --------------------------------------------------------

  GmailApp.sendEmail(
    email,
    subject,
    body,
    {
      name: SENDER_NAME
    }
  );


  Logger.log(
    "Follow-up 2 recipient: " +
    email
  );
}


// ==========================================================
// 9. FIND LATEST SENT THREAD
// ==========================================================

function findLatestSentThread(
  email,
  subject
) {

  try {

    const safeSubject =
      subject.replace(
        /"/g,
        '\\"'
      );


    const query =
      `in:sent to:${email} subject:"${safeSubject}" newer_than:1d`;


    const threads =
      GmailApp.search(
        query,
        0,
        10
      );


    if (
      threads.length > 0
    ) {

      return threads[0];
    }


    return null;


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
// ==========================================================

function createDailyTriggers() {

  // Remove existing triggers first
  deleteAllTriggers();


  // --------------------------------------------------------
  // Initial emails
  // --------------------------------------------------------

  ScriptApp
    .newTrigger(
      "sendPendingEmails"
    )
    .timeBased()
    .everyDays(1)
    .atHour(10)
    .create();


  // --------------------------------------------------------
  // Reply detection
  // --------------------------------------------------------

  ScriptApp
    .newTrigger(
      "checkAllReplies"
    )
    .timeBased()
    .everyDays(1)
    .atHour(11)
    .create();


  // --------------------------------------------------------
  // Follow-ups
  // --------------------------------------------------------

  ScriptApp
    .newTrigger(
      "processFollowUps"
    )
    .timeBased()
    .everyDays(1)
    .atHour(12)
    .create();


  // --------------------------------------------------------
  // Ignored processing
  // --------------------------------------------------------

  ScriptApp
    .newTrigger(
      "finalizeIgnored"
    )
    .timeBased()
    .everyDays(1)
    .atHour(13)
    .create();


  Logger.log(
    "Daily automation successfully created."
  );
}


// ==========================================================
// 11. DELETE ALL TRIGGERS
// ==========================================================

function deleteAllTriggers() {

  const triggers =
    ScriptApp.getProjectTriggers();


  triggers.forEach(
    function(trigger) {

      ScriptApp.deleteTrigger(
        trigger
      );

    }
  );


  Logger.log(
    "All triggers deleted."
  );
}


// ==========================================================
// 12. GET SHEET
// ==========================================================

function getSheet() {

  const sheet =
    SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName(
        SHEET_NAME
      );


  if (!sheet) {

    throw new Error(
      "Sheet not found: " +
      SHEET_NAME
    );
  }


  return sheet;
}


// ==========================================================
// 13. ENSURE HEADERS
// ==========================================================

function ensureHeaders(
  sheet
) {

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
    .getRange(
      1,
      1,
      1,
      expectedHeaders.length
    )
    .setValues(
      [expectedHeaders]
    );
}


// ==========================================================
// 14. CLEAN VALUE
// ==========================================================

function cleanValue(
  value
) {

  if (
    value === null ||
    value === undefined
  ) {

    return "";
  }


  return String(value).trim();
}


// ==========================================================
// 15. EMAIL VALIDATION
// ==========================================================

function isValidEmail(
  email
) {

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    .test(email);
}


// ==========================================================
// 16. EXTRACT EMAIL ADDRESS
// ==========================================================

function extractEmail(
  value
) {

  if (!value) {
    return "";
  }


  const match =
    String(value)
      .match(
        /<([^>]+)>/
      );


  if (match) {

    return match[1]
      .trim()
      .toLowerCase();
  }


  return String(value)
    .trim()
    .toLowerCase();
}


// ==========================================================
// 17. ADD DAYS
// ==========================================================

function addDays(
  date,
  days
) {

  const result =
    new Date(date);


  result.setDate(
    result.getDate() + days
  );


  return result;
}
