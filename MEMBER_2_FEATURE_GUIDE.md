# Member 2 Feature Exploration Guide — Smart Classroom

This guide explains how to test and explore all **8 features assigned to Member 2 (Teacher Side)** based on the project matrix.

---

## 📋 Overview of Member 2 Responsibilities

| Category | Feature Name | Role / Side | Tab in Classroom |
| :--- | :--- | :--- | :--- |
| **Classroom & Attendance** | 1. Manual & Bulk Attendance Marking | Teacher | `📋 Attendance` |
| **Classroom & Attendance** | 2. Attendance Dashboard & Reports | Teacher | `📋 Attendance` |
| **Communication** | 3. View Anonymous Feedback | Teacher | `💬 Feedback` |
| **Communication** | 4. View & Approve/Reject Leave Requests | Teacher | `📋 Leaves` |
| **Academics** | 5. Create Topic-Wise Quizzes | Teacher | `🧩 Topic Quiz` |
| **Academics** | 6. Manage/Answer Topic-Wise Q&A | Teacher | `❓ Topic Q&A` |
| **Academics** | 7. Manage Lesson Plan Calendar | Teacher | `📅 Lesson Plan` |
| **Engagement & Resources** | 8. Upload Resources & View Student Resources | Teacher | `📁 Resources` |

---

## 🚀 Prerequisites

1. **Backend Server**: Running at `http://localhost:5000`
2. **Frontend App**: Running at `http://localhost:3000`
3. **Database**: MongoDB running locally on port `27017`

---

## 🔑 Initial Setup: Creating Test Accounts & Classroom

Because Member 2 features interact with students (e.g., student leaves, student feedback, student attendance, student questions), it is best to have **one Teacher account** and **one Student account** ready.

### Step 1: Sign up a Teacher & Create a Classroom
1. Go to [http://localhost:3000/signup](http://localhost:3000/signup)
2. Select **Teacher**, enter an email and password (e.g. `teacher@test.com` / `123456`), and sign up.
3. Login via [http://localhost:3000/teacher-login](http://localhost:3000/teacher-login).
4. On the **Teacher Dashboard**, click **"Create Classroom"** (or go to `/create-classroom`).
5. Enter a Course Name (e.g. `CSE470`) and Section (e.g. `1`).
6. **Note the 6-digit Class Code** generated (e.g. `ABC123`).

### Step 2: Sign up a Student & Join the Classroom
*(Open an Incognito / Private browsing window so both sessions can stay logged in)*
1. Go to [http://localhost:3000/signup](http://localhost:3000/signup).
2. Select **Student**, enter details:
   - Name: `John Doe`
   - Student ID: `20101001`
   - Department: `CSE`
   - Email: `student@test.com` / Password: `123456`
3. Log in at [http://localhost:3000/student-login](http://localhost:3000/student-login).
4. On the Student Dashboard, enter the **Class Code** and click **"Join Classroom"**.

---

## 🧪 Detailed Step-by-Step Feature Walkthrough

Now log in as the **Teacher** and open your classroom page at:
`http://localhost:3000/classroom/<YOUR_CLASS_CODE>`

---

### Category 1: Classroom & Attendance

#### Feature 1: Manual & Bulk Attendance Marking
- **Location**: Click the **Attendance** tab (`📋 Attendance`).
- **Steps to Test**:
  1. Pick or set the **Start Date** to generate the 30-day attendance sheet.
  2. You will see enrolled students (including the student who joined in Setup).
  3. **Manual Marking**: Click on any cell corresponding to a date and student to cycle or toggle the attendance status (`Present` / `Absent`).
  4. **Bulk Marking**: Use the bulk action buttons (e.g., "Mark All Present" or "Mark All Absent") to set the status of all students for that day at once.
  5. Click **"Save Attendance"** to persist the records in the database.

#### Feature 2: Attendance Dashboard & Reports
- **Location**: Click the **Attendance** tab (`📋 Attendance`).
- **Steps to Test**:
  1. Review the attendance statistics and percentage column for each enrolled student.
  2. Notice the real-time calculation of total classes attended vs. total classes conducted.
  3. Check the report / export capabilities (e.g. generating summary views or PDF export where enabled).

---

### Category 2: Communication

#### Feature 3: View Anonymous Feedback
- **Location**: Click the **Feedback** tab.
- **Workflow**:
  1. **Student Side**: In the student window, click the **Feedback** tab. Type feedback (e.g., *"The lecture on MVC was clear, but please provide more examples on controllers."*) and click **Submit**.
  2. **Teacher Side (Member 2)**: Switch to the teacher's classroom view and click the **Feedback** tab.
  3. Under **"Anonymous Feedback Received"**, verify that the message appears with the timestamp and that **no student name or ID is revealed**.
  4. Click the **Delete** button to verify feedback moderation.

#### Feature 4: View & Approve/Reject Leave Requests
- **Location**: Click the **Leaves** tab (`📋 Leaves`).
- **Workflow**:
  1. **Student Side**: In the student window, click the **Leaves** tab. Fill out:
     - Student ID: `20101001`
     - Student Name: `John Doe`
     - Date of Leave & Reason: `Medical emergency`
     - Click **Submit Leave Request**.
  2. **Teacher Side (Member 2)**: Switch to the teacher window and click the **Leaves** tab.
  3. Under **"Student Leave Requests"**, you will see the pending request card showing the student name, ID, date, reason, and status `Pending`.
  4. Click **Approve** (green button) or **Reject** (red button).
  5. The status badge immediately updates to `Approved` or `Rejected`.

---

### Category 3: Academics

#### Feature 5: Create Topic-Wise Quizzes
- **Location**: Click the **Topic Quiz** tab (`🧩 Topic Quiz`).
- **Steps to Test**:
  1. Under **"Create Topic-Wise Quiz"**, enter a Topic name (e.g. `Software Architecture`).
  2. For **Question 1**:
     - Type: *"What does MVC stand for?"*
     - Fill options: `Model View Controller`, `Module Variable Class`, `Main View Control`, `Modern Virtual Component`.
     - Enter correct answer: `Model View Controller`.
  3. Click **"+ Add Question"** if you want to add more questions.
  4. Click **"Create Quiz"**.
  5. **Verification**: The new quiz will now appear in the classroom quizzes list. Students can take the quiz and view their score.

#### Feature 6: Manage/Answer Topic-Wise Q&A
- **Location**: Click the **Topic Q&A** tab (`❓ Topic Q&A`).
- **Workflow**:
  1. **Student Side**: In the student window, go to **Topic Q&A** tab:
     - Enter Topic: `Database Indexing`
     - Question: *"When should we avoid adding a B-tree index on a column?"*
     - Submit question.
  2. **Teacher Side (Member 2)**: Switch to the teacher window and refresh or go to **Topic Q&A** tab.
  3. You will see the student's question under `Database Indexing`.
  4. Type your teacher answer into the answer box (e.g. *"Avoid indexing frequently updated columns with low cardinality."*).
  5. Click **"Submit Answer"**.
  6. The question card updates to show the verified answer.

#### Feature 7: Manage Lesson Plan Calendar
- **Location**: Click the **Lesson Plan** tab (`📅 Lesson Plan`).
- **Steps to Test**:
  1. Click on any date on the calendar.
  2. Enter the **Topic**: (e.g. `Agile & Scrum Methodologies`).
  3. Enter the **Notes / Agenda**: (e.g. `Sprint planning, daily standups, and retrospective demo`).
  4. Click **"Save Lesson Plan"** (or "Add Plan").
  5. Verify that the scheduled lesson plan appears on that calendar date and remains persistent upon page reload.

---

### Category 4: Engagement & Resources

#### Feature 8: Upload Resources & View Student Resources
- **Location**: Click the **Resources** tab (`📁 Resources`).
- **Steps to Test**:
  1. Under **"Upload Class Resource"**:
     - Choose the **Resource Type** (e.g. `Lecture Notes`, `Syllabus`, `Slides`, `Reference Book`).
     - Choose a file from your computer (e.g. a `.pdf`, `.png`, or `.docx` document).
     - Click **"Upload Resource"**.
  2. Verify that the file appears under **"Class Resources"** with a download/view link and the upload timestamp.
  3. Under **"Student Resources"**, check any shared materials uploaded or requested by students.

---

## 🛠️ Technical Reference (Files & Routes)

### Frontend Components
- `src/components/Attendance/AttendanceDashboard.js` — Manual & Bulk Attendance, Reports
- `src/components/TeacherDashboard/Announcement/ViewFeedback.js` — View Anonymous Feedback
- `src/components/TeacherDashboard/Announcement/LeaveRequests.js` — View & Approve/Reject Leaves
- `src/components/TopicWiseQuiz.js` — Create Topic-Wise Quizzes
- `src/components/TopicWiseQnA.js` — Manage & Answer Topic-Wise Q&A
- `src/components/LessonPlanCalendar.js` — Manage Lesson Plan Calendar
- `src/components/ResourceUpload.js` & `src/components/ViewStudentResources.js` — Upload & View Resources

### Backend Controllers & Endpoints
- **Attendance**: `/api/attendance` (`backend/controllers/attendanceController.js`)
- **Anonymous Feedback**: `/api/anonymous-feedback` or `/api/feedback` (`backend/controllers/anonymousFeedbackController.js`)
- **Leave Requests**: `/api/leave-requests` (`backend/controllers/leaveRequestController.js`)
- **Topic-Wise Quiz**: `/api/topicwise-quiz` (`backend/controllers/topicWiseQuizController.js`)
- **Topic-Wise Q&A**: `/api/topicwise-qna` (`backend/controllers/topicWiseQnAController.js`)
- **Lesson Plan**: `/api/lesson-plans` (`backend/controllers/lessonPlanController.js`)
- **Resources**: `/api/resources` (`backend/controllers/resourceController.js`)
