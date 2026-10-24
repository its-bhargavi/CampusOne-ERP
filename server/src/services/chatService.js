function includesAny(text, words) {
  return words.some((word) => text.includes(word));
}

function localAnswer(question, context) {
  const q = question.toLowerCase().trim().replace(/[’']/g, "'");
  const role = context.user.role;
  const firstName = context.user.fullName?.split(" ")[0] || "there";
  const isFaculty = role === "FACULTY";
  const isStudent = role === "STUDENT";

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)[!. ]*$/.test(q)) {
    return `Hi ${firstName}! I can help with your ${role.toLowerCase()} ERP workspace. Ask about ${isFaculty ? "attendance, Machine Learning lectures, notices, or feedback" : "your attendance, campus events, announcements, perks, or feedback"}.`;
  }

  // Answer action/how-to questions before returning data lists. This avoids
  // generic attendance/schedule data being returned for procedural questions.
  if (isFaculty && includesAny(q, ["mark absent", "mark a student absent", "student absent", "mark present", "mark a student present", "take attendance", "record attendance", "update attendance", "edit attendance", "correct attendance"])) {
    return "Open Attendance management from the left menu. Find the student's record, choose Present or Absent for the class, and save the change. To correct an existing record, edit its attendance counts and save. Verify the updated percentage afterward. The assistant explains the process; it does not change attendance for you.";
  }

  if (includesAny(q, ["how do i check", "how can i check", "check my attendance", "my attendance", "attendance percentage", "attendance report", "how many classes", "attendance status", "attendance target", "75%", "low attendance"])) {
    if (!context.attendance.length) return "I couldn't find attendance records available to this account yet.";
    if (isFaculty) {
      return "Open Attendance management to view student records. Current records available to your role:\n" + context.attendance.map((row) => {
        const pct = row.totalClasses ? (row.attended / row.totalClasses) * 100 : 0;
        return `• ${row.studentName || "Student"} — ${row.subject}: ${row.attended}/${row.totalClasses} classes (${pct.toFixed(1)}%)`;
      }).join("\n");
    }
    return "Your attendance records:\n" + context.attendance.map((row) => {
      const pct = row.totalClasses ? (row.attended / row.totalClasses) * 100 : 0;
      return `• ${row.subject}: ${row.attended}/${row.totalClasses} classes (${pct.toFixed(1)}%)`;
    }).join("\n");
  }

  if (includesAny(q, ["how do i manage", "how can i manage", "add a lecture", "add lecture", "delete a lecture", "schedule a lecture", "create a lecture", "lecture schedule", "manage my machine learning", "manage my ml", "timetable", "class time", "lecture timing"])) {
    const schedule = context.lectures.length
      ? "Current schedule:\n" + context.lectures.map((l) => `• ${l.day}, ${l.startTime}-${l.endTime}: ${l.subject}, ${l.room} (${l.facultyName})`).join("\n")
      : "There are no lecture schedules saved yet.";
    if (isFaculty) return `Open Lectures & timings. Use the schedule form to add a lecture by entering the subject, day, start/end time, and room. Use the available delete control to remove a schedule if shown.\n\n${schedule}\n\nI can explain the steps, but you must make changes in the module.`;
    return schedule;
  }

  if (includesAny(q, ["lecture", "timetable", "timing", "schedule", "class time"])) {
    return context.lectures.length ? "Lecture schedule:\n" + context.lectures.map((l) => `• ${l.day} ${l.startTime}-${l.endTime}: ${l.subject}, ${l.room} (${l.facultyName})`).join("\n") : "No lectures have been scheduled.";
  }

  if (includesAny(q, ["announcement", "notice", "noticeboard", "latest notice", "latest announcement"])) {
    return context.announcements.length ? "Latest announcements:\n" + context.announcements.slice(0, 5).map((a) => `• ${a.title}: ${a.message}`).join("\n") : "No announcements are available to your role.";
  }

  if (includesAny(q, ["feedback", "review"])) {
    if (isStudent) return "Open the Feedback module, enter a subject and your message, then submit it. Avoid including passwords or other sensitive information.";
    return context.feedback.length ? "Student feedback:\n" + context.feedback.map((f) => `• ${f.studentName || "Student"} — ${f.subject} [${f.status || "SUBMITTED"}]: ${f.message}`).join("\n") : "No student feedback has been submitted yet.";
  }

  if (includesAny(q, ["event", "fest", "calendar", "upcoming"])) {
    return context.events.length ? "Campus events:\n" + context.events.map((e) => `• ${e.title} — ${e.eventDate}: ${e.description}`).join("\n") : "No campus events have been added.";
  }

  if (includesAny(q, ["perk", "benefit", "discount", "offer"])) {
    return context.perks.length ? "Student perks:\n" + context.perks.map((p) => `• ${p.title} (${p.category}): ${p.description}`).join("\n") : "No student perks are listed.";
  }

  if (includesAny(q, ["how do i", "how can i", "where do i", "where can i", "how to"])) {
    if (includesAny(q, ["notice", "announcement", "publish"])) return isFaculty ? "Open Notices & announcements, fill in the title and message, choose the audience, and publish the notice." : "Open Announcements to read notices visible to your student account. Faculty publish notices from Notices & announcements.";
    if (includesAny(q, ["event", "register"])) return "Open Campus events to review the event details. Registration is only available if the event or linked registration process provides it.";
    if (includesAny(q, ["perk", "claim"])) return "Open Student perks to review the listed benefits and their descriptions. Follow any eligibility or redemption instructions shown there.";
    if (includesAny(q, ["feedback"])) return "Open the Feedback module, enter a subject and message, and submit it.";
  }

  return `I couldn't match that to a specific ERP question. Try asking about ${isFaculty ? "marking attendance, Machine Learning lecture schedules, notices, or student feedback" : "your attendance, campus events, announcements, student perks, or feedback"}. I can only answer using the information and actions available in this demo.`;
}

async function llmAnswer(question, context) {
  if (process.env.AI_ENABLED !== "true" || !process.env.OPENAI_API_KEY) return null;
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  const safeContext = {
    role: context.user.role,
    attendance: context.attendance.map(({ studentName, subject, attended, totalClasses, percentage }) => ({ studentName, subject, attended, totalClasses, percentage })),
    events: context.events.map(({ title, eventDate, description }) => ({ title, eventDate, description })),
    perks: context.perks.map(({ title, category, description }) => ({ title, category, description })),
    announcements: context.announcements.map(({ title, message, audience }) => ({ title, message, audience })),
    lectures: context.lectures.map(({ subject, facultyName, day, startTime, endTime, room }) => ({ subject, facultyName, day, startTime, endTime, room })),
    feedback: context.user.role === "STUDENT" ? [] : context.feedback.map(({ studentName, subject, message, status }) => ({ studentName, subject, message, status }))
  };
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 180,
      messages: [
        { role: "system", content: "You are a concise college ERP assistant. Answer the exact question in 1-4 short sentences. For how-to questions, give practical steps instead of a generic capability list. Answer only from authorized supplied context. If information is missing, say so. Never invent attendance, event, or schedule data. Do not claim to perform an action; explain how the user can do it in the ERP interface. Sample data is illustrative." },
        { role: "user", content: `AUTHORIZED ERP CONTEXT:\n${JSON.stringify(safeContext)}\n\nQUESTION:\n${question}` }
      ]
    }),
    signal: AbortSignal.timeout(20000)
  });
  if (!response.ok) throw new Error(`AI provider returned HTTP ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content?.trim() || null;
}

export async function answerQuestion(question, context) {
  try {
    const answer = await llmAnswer(question, context);
    if (answer) return { reply: answer, mode: "AI-assisted" };
  } catch (error) {
    console.warn("AI unavailable; using local fallback:", error.message);
  }
  return { reply: localAnswer(question, context), mode: "local assistant" };
}
