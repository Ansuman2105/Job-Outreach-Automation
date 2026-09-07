# UAE Data Engineer Job Outreach Automation

A Google Apps Script automation that manages recruiter outreach for Data Engineer job applications.

The project uses:

- Google Sheets — recruiter/application tracking
- Gmail — sending applications and follow-ups
- Google Drive — storing the PDF CV
- Google Apps Script — automation and scheduling

## Workflow

```text
Pending
   |
   v
Initial email + CV
   |
   v
Sent
   |
   | 4 days
   v
Follow-up 1
   |
   | 5 days
   v
Follow-up 2
   |
   | 5 days without reply
   v
Ignored

At any point:
Recruiter replies -> Success
```

## Google Sheet structure

Create a sheet named `Sheet1` with these columns:

| Column | Header |
|---|---|
| A | Recruiter Name |
| B | Email |
| C | Company |
| D | Job Title |
| E | Status |
| F | Sent Date |
| G | Follow-up Date |
| H | Follow-up Count |
| I | Gmail Thread ID |

For a new recruiter, fill only:

```text
Recruiter Name
Email
Company
Job Title
Pending
```

The automation fills the remaining fields.

## Setup

### 1. Create the Google Sheet

Create a Google Sheet and name the tab:

```text
Sheet1
```

Add the headers shown above.

### 2. Open Apps Script

In Google Sheets:

```text
Extensions -> Apps Script
```

Copy the contents of:

```text
src/Code.gs
```

into the Apps Script editor.

### 3. Configure your CV

Upload your PDF CV to Google Drive.

Copy the Drive file ID from its URL.

For example:

```text
https://drive.google.com/file/d/FILE_ID/view
```

Then change:

```javascript
const CV_FILE_ID = "YOUR_GOOGLE_DRIVE_PDF_FILE_ID";
```

to your own ID.

Also change:

```javascript
const SENDER_NAME = "Your Name";
```

Do not commit your personal CV ID, email addresses, or other private information to a public repository.

### 4. Test before enabling automation

Add your own test email to the sheet:

```text
Test | your-email@gmail.com | Test Company | Data Engineer | Pending
```

Run:

```text
sendPendingEmails
```

Verify that the email and CV arrive.

Then test:

```text
checkAllReplies
```

using a reply from another email account.

### 5. Enable daily automation

After testing successfully, run:

```text
createDailyTriggers
```

This creates four daily triggers:

- 10 AM — send new pending applications
- 11 AM — check recruiter replies
- 12 PM — process due follow-ups
- 1 PM — finalize due Follow-up 2 records

Apps Script time-driven triggers are approximate rather than guaranteed to execute at the exact minute.

## Status meanings

| Status | Meaning |
|---|---|
| `Pending` | New recruiter waiting for initial email |
| `Sent` | Initial application sent |
| `Follow-up 1` | First follow-up sent |
| `Follow-up 2` | Second/final follow-up sent |
| `Success` | Recruiter replied |
| `Ignored` | No reply after the follow-up sequence |
| `Failed` | Email operation failed |

## Daily usage

Once automation is enabled, your manual workflow is:

```text
Find recruiter
     |
     v
Add recruiter to Google Sheet
     |
     v
Set Status = Pending
     |
     v
Done
```

The automation handles the rest.

## Important notes

### Gmail sending limits

Google accounts have sending limits and these can vary by account type. The project therefore includes configurable daily limits:

```javascript
const INITIAL_EMAIL_LIMIT = 15;
const FOLLOWUP_EMAIL_LIMIT = 15;
```

Start conservatively and respect Google's policies.

### Reply detection

The script first checks the stored Gmail thread. If a thread ID is unavailable, it uses a Gmail search fallback.

Because email matching can never be perfect for every mail system, review your `Success`/`Ignored` records periodically.

### Privacy

Do not publish:

- Your CV
- Personal email addresses
- Recruiter email lists
- Private Google Drive IDs
- OAuth credentials
- API keys
- Any other personal or confidential information

Keep your public GitHub repository limited to the reusable automation code and documentation.

## Project structure

```text
uae-data-engineer-job-outreach-automation/
├── src/
│   └── Code.gs
├── .gitignore
├── LICENSE
└── README.md
```

## License

MIT License. See `LICENSE`.
