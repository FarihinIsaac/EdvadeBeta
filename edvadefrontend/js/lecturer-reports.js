const REPORT_KEY = "lecturerReports"; 
// Each report item (demo) = {id, studentEmail, quizTitle, score, total, submittedAt}

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function uid() {
  return "r_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getReports() {
  return readJSON(REPORT_KEY, []);
}
function saveReports(r) {
  writeJSON(REPORT_KEY, r);
}

function updateSummary(list) {
  const attempts = list.length;
  let avg = 0;
  let top = 0;

  if (attempts > 0) {
    const percents = list.map(x => Math.round((x.score / x.total) * 100));
    avg = Math.round(percents.reduce((a,b)=>a+b,0) / attempts);
    top = Math.max(...percents);
  }

  document.getElementById("sumAttempts").textContent = attempts;
  document.getElementById("sumAvg").textContent = avg + "%";
  document.getElementById("sumTop").textContent = top + "%";
}

function renderReports() {
  const emailFilter = document.getElementById("filterEmail").value.trim().toLowerCase();
  const quizFilter = document.getElementById("filterQuiz").value.trim().toLowerCase();

  let reports = getReports();

  if (emailFilter) reports = reports.filter(r => r.studentEmail.toLowerCase().includes(emailFilter));
  if (quizFilter) reports = reports.filter(r => r.quizTitle.toLowerCase().includes(quizFilter));

  updateSummary(reports);

  const el = document.getElementById("reportList");
  if (reports.length === 0) {
    el.innerHTML = `<div class="empty">No attempts found.</div>`;
    return;
  }

  el.innerHTML = reports.map(r => {
    const pct = Math.round((r.score / r.total) * 100);
    return `
      <div class="post">
        <div class="row space">
          <div class="post-title">${r.studentEmail}</div>
          <div class="pill">${pct}%</div>
        </div>
        <div class="post-body small muted">
          Quiz: <b>${r.quizTitle}</b><br/>
          Score: <b>${r.score}/${r.total}</b><br/>
          Submitted: ${new Date(r.submittedAt).toLocaleString()}
        </div>
      </div>
    `;
  }).join("");
}

function seedDemoReports() {
  const demo = [
    { id: uid(), studentEmail:"student1@gmail.com", quizTitle:"Intro Quiz", score:8, total:10, submittedAt:new Date().toISOString() },
    { id: uid(), studentEmail:"student2@gmail.com", quizTitle:"OOP Quiz", score:6, total:10, submittedAt:new Date().toISOString() },
    { id: uid(), studentEmail:"student1@gmail.com", quizTitle:"OOP Quiz", score:9, total:10, submittedAt:new Date().toISOString() }
  ];
  saveReports(demo);
  renderReports();
}

function clearReports() {
  saveReports([]);
  renderReports();
}

renderReports();
