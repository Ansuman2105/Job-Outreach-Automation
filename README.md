<div align="center">

# 🌍 Global Job Outreach Automation

### Automate your job applications. Track every recruiter. Never forget a follow-up.

<p>
  <img src="https://img.shields.io/badge/Google%20Apps%20Script-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20Sheets-34A853?style=for-the-badge&logo=googlesheets&logoColor=white" />
  <img src="https://img.shields.io/badge/Gmail-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  <img src="https://img.shields.io/badge/Google%20Drive-4285F4?style=for-the-badge&logo=googledrive&logoColor=white" />
</p>

<p>
  <img src="https://img.shields.io/badge/Automation-Enabled-00C853?style=flat-square" />
  <img src="https://img.shields.io/badge/Cost-Free-00C853?style=flat-square" />
  <img src="https://img.shields.io/github/license/YOUR_USERNAME/YOUR_REPOSITORY?style=flat-square" />
</p>

<br>

> 🚀 **A lightweight, serverless job outreach automation built with Google Apps Script, Gmail and Google Sheets.**

</div>

---

## ✨ Why This Project?

Searching for jobs manually can become repetitive:

- 📧 Sending the same application email again and again
- 📎 Attaching your CV every time
- 📅 Remembering when to follow up
- 🔎 Checking whether recruiters replied
- 📝 Maintaining application status manually
- ❌ Forgetting recruiters after the first email

This project turns that repetitive workflow into an automated pipeline.

You simply add a recruiter to your Google Sheet:

```text
Recruiter → Email → Company → Job Title → Pending


| Feature              | Description                                               |
| -------------------- | --------------------------------------------------------- |
| 📧 Initial Outreach  | Automatically sends your predefined application email     |
| 📎 CV Attachment     | Automatically attaches your PDF CV                        |
| ⏰ Follow-up #1       | Sends the first follow-up after the configured delay      |
| ⏰ Follow-up #2       | Sends a final follow-up if there is still no response     |
| 💬 Reply Detection   | Checks Gmail for recruiter responses                      |
| ✅ Success Tracking   | Automatically marks applications as `Success`             |
| 🚫 Ignored Tracking  | Marks applications as `Ignored` after the follow-up cycle |
| 📊 Google Sheets CRM | Uses Sheets as a lightweight application tracker          |
| ☁️ Serverless        | Runs using Google Apps Script                             |
| 💰 Free              | No paid automation platform required                      |


<img width="5721" height="818" alt="mermaid-diagram" src="https://github.com/user-attachments/assets/ae9d77a0-3876-442f-b358-f19a3655c9dd" />

🔄 Application Lifecycle
                    ┌──────────────┐
                    │   PENDING    │
                    └──────┬───────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ INITIAL EMAIL   │
                  │ + CV ATTACHED   │
                  └────────┬────────┘
                           │
                           ▼
                     ┌───────────┐
                     │   SENT    │
                     └─────┬─────┘
                           │
                    Wait configured days
                           │
                           ▼
                  ┌─────────────────┐
                  │  FOLLOW-UP #1  │
                  └────────┬────────┘
                           │
                    Wait configured days
                           │
                           ▼
                  ┌─────────────────┐
                  │  FOLLOW-UP #2  │
                  └────────┬────────┘
                           │
                    Wait configured days
                           │
                           ▼
                     ┌───────────┐
                     │  IGNORED  │
                     └───────────┘


      ┌───────────────────────────────────────┐
      │                                       │
      │ Recruiter replies at ANY stage       │
      │                                       │
      └──────────────────┬────────────────────┘
                         │
                         ▼
                    ┌──────────┐
                    │ SUCCESS  │
                    └──────────┘

🧩 Technology Stack
<div align="center">
Technology	Purpose
🟦 Google Apps Script	Automation engine
📊 Google Sheets	Application database / tracker
📧 Gmail	Email delivery & reply detection
☁️ Google Drive	CV/document storage
📝 JavaScript	Automation logic
</div>

📊 Google Sheets Structure

The system uses Google Sheets as a lightweight CRM.

Column	Field	Purpose
A	Recruiter Name	Recruiter's name
B	Email	Recruiter's email
C	Company	Target company
D	Job Title	Position being targeted
E	Status	Current application state
F	Sent Date	Initial email date
G	Follow-up Date	Next scheduled action
H	Follow-up Count	Number of follow-ups
I	Gmail Thread ID	Gmail conversation reference
Example
Recruiter Name	Email	Company	Job Title	Status
John	recruiter@example.com	Example Corp	Data Engineer	Pending
Sarah	hr@example.com	Global Tech	Software Engineer	Sent
Mike	jobs@example.com	Tech Ltd	Cloud Engineer	Success

⚡ Automation Workflow

1️⃣ Add a recruiter
Simply add:
Recruiter Name
Email
Company
Job Title
Status = Pending

2️⃣ Initial email
The automation detects:
Status = Pending
and automatically:
📧 Creates email
       ↓
📎 Attaches CV
       ↓
📨 Sends email
       ↓
📅 Stores sent date
       ↓
🧵 Stores Gmail thread ID
       ↓
📆 Schedules follow-up
3️⃣ Follow-up system

The automation checks the Follow-up Date.

If the recruiter hasn't replied:

Initial Email
     ↓
Follow-up #1
     ↓
Follow-up #2
     ↓
Ignored

4️⃣ Reply detection

The script checks Gmail for responses from the recruiter.

If a response is detected:

Recruiter Reply
      ↓
Gmail detected
      ↓
Google Apps Script
      ↓
Status = SUCCESS ✅

No more manual tracking.

🗂️ Project Structure
global-job-outreach-automation/
│
├── 📁 src/
│   └── Code.gs
│
├── 📄 README.md
├── 📄 sample_sheet.csv
├── 📄 LICENSE
└── 📄 .gitignore
🚀 Getting Started
Prerequisites

You only need:

Google Account
Google Sheets
Gmail
Google Drive
A PDF CV
Google Apps Script

No external server is required.

1. Create Google Sheet

Create a new Google Sheet.

Create a sheet named:

Sheet1

Add:

Recruiter Name
Email
Company
Job Title
Status
Sent Date
Follow-up Date
Follow-up Count
Gmail Thread ID
2. Open Apps Script

Inside Google Sheets:

Extensions
   ↓
Apps Script

Copy:

src/Code.gs

into the Apps Script editor.

3. Configure your CV

Upload your CV to Google Drive.

Copy the file ID from the Drive URL:

https://drive.google.com/file/d/YOUR_FILE_ID/view

Then configure:

const CV_FILE_ID = "YOUR_GOOGLE_DRIVE_PDF_FILE_ID";

Also configure:

const SENDER_NAME = "Your Name";
🧪 Testing

Before enabling the automated triggers, test manually.

Test initial email

Run:

sendPendingEmails()

Verify:

Email received
CV attached
Status changed
Sent date populated
Follow-up date populated
Test reply detection

Reply to the test email from another email account.

Then run:

checkAllReplies()

Expected:

Status → Success
Test follow-ups

You can temporarily change the follow-up intervals:

const FOLLOWUP_1_DAYS = 1;
const FOLLOWUP_2_DAYS = 1;

for testing.

After testing, restore your preferred values.

⏰ Automatic Scheduling

Once everything works, run:

createDailyTriggers()

The automation creates scheduled jobs for:

🕙 10:00 → Send pending applications

🕚 11:00 → Check recruiter replies

🕛 12:00 → Process follow-ups

🕐 13:00 → Finalize ignored applications

⚠️ Google Apps Script time-based triggers are approximate. They should be treated as scheduled windows rather than guaranteed exact execution times.

🔐 Security & Privacy
The repository intentionally uses placeholders such as:

const CV_FILE_ID = "YOUR_GOOGLE_DRIVE_PDF_FILE_ID";

Your private configuration should remain inside your Google Apps Script project.

📈 Possible Future Improvements

This project can be extended significantly.

🔎 Job Discovery

Automatically collect job opportunities from:

LinkedIn
Indeed
Bayt
GulfTalent
Naukri
Company Career Pages
Other Job Boards
🤖 Intelligent Personalization

Generate customized emails based on:

Job Description
Company
Recruiter
Required Skills
Candidate Experience
📊 Analytics Dashboard

Add a dashboard showing:

Total Applications
        ↓
Emails Sent
        ↓
Follow-ups Sent
        ↓
Responses
        ↓
Success Rate
        ↓
Ignored Applications
🧠 Smart Prioritization

Automatically rank opportunities:

Job Match
   +
Company
   +
Location
   +
Experience
   +
Skills
   ↓
Priority Score
📱 Notifications

Potential integrations:

Gmail
Slack
Telegram
Google Chat

for recruiter responses and important application events.

📊 Example Metrics Dashboard

A future dashboard could look like:

┌────────────────────────────────────────────┐
│          GLOBAL JOB SEARCH                  │
├────────────────────────────────────────────┤
│                                            │
│  📩 Applications       127                 │
│  📧 Emails Sent        115                 │
│  🔁 Follow-ups          83                 │
│  💬 Responses           17                 │
│  ✅ Success              9                 │
│  🚫 Ignored             74                 │
│                                            │
│  Response Rate          14.8%              │
│                                            │
└────────────────────────────────────────────┘
🧠 Design Philosophy

The project follows a simple principle:

Automate repetitive work so you can focus on high-value work.

Instead of spending hours managing:

Emails
Follow-ups
Dates
Responses
Application status

you maintain one simple source of truth:

             GOOGLE SHEETS
                   │
                   ▼
          ┌─────────────────┐
          │ Job Applications│
          └────────┬────────┘
                   │
          GOOGLE APPS SCRIPT
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
      Gmail     Scheduler   Tracking

🌎 Built for Global Job Searches

This project is intentionally not tied to one country, company, role, or industry.

You can use it for:

🌍 International job searches
🇮🇳 India
🇦🇪 UAE
🇸🇦 Saudi Arabia
🇶🇦 Qatar
🇬🇧 UK
🇩🇪 Germany
🇨🇦 Canada
🇦🇺 Australia
🇺🇸 USA
🌎 Remote opportunities

And for roles such as:

Data Engineer
Software Engineer
Cloud Engineer
DevOps Engineer
Data Analyst
Business Analyst
Backend Engineer
Cloud Architect
Project Manager
Product Manager
⭐ Why Use This Instead of Paid Automation Tools?

You don't need a third-party automation subscription for the core workflow.

             Traditional Approach

Job Search
    ↓
Email
    ↓
Follow-up
    ↓
CRM
    ↓
Automation Tool
    ↓
Subscription

vs.

             This Project

Google Sheets
      ↓
Google Apps Script
      ↓
Gmail + Google Drive
      ↓
     FREE*

* Subject to Google's account limits, policies and service availability.

🛠️ Configuration

The main configuration variables are:

const CV_FILE_ID = "YOUR_GOOGLE_DRIVE_PDF_FILE_ID";

const SENDER_NAME = "Your Name";

const INITIAL_EMAIL_LIMIT = 15;

const FOLLOWUP_EMAIL_LIMIT = 15;

const FOLLOWUP_1_DAYS = 4;

const FOLLOWUP_2_DAYS = 5;

Adjust these according to your workflow and Google's applicable sending limits.

🤝 Contributing

Contributions are welcome!

Possible areas:

Job-board integrations
Better reply detection
Analytics dashboard
Email templates
AI personalization
Notification integrations
Improved scheduling
Application analytics
Contribution workflow
git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git

cd YOUR_REPOSITORY

git checkout -b feature/my-feature

git add .

git commit -m "Add my feature"

git push origin feature/my-feature

Then open a Pull Request.

📜 License

This project is licensed under the MIT License.

See LICENSE for details.

⭐ Support

If you find this project useful:

⭐ Star the repository

🍴 Fork it

🐛 Open an issue

💡 Suggest an improvement

🤝 Contribute

<div align="center">
🚀 Automate the search. Focus on the opportunity.

Built with ❤️ using Google Apps Script + Gmail + Google Sheets

<br>

⭐ If this project helped you, consider giving it a star! ⭐

</div> ```
