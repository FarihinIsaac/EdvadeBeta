const QUIZ_KEY = "lecturerQuizzes";
const DRAFT_KEY = "lecturerQuizDraftQuestions";

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
  catch { return fallback; }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function uid() {
  return "q_" + Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* -------- Draft questions -------- */
function renderDraft() {
  const draft = readJSON(DRAFT_KEY, []);
  const el = document.getElementById("draftList");

  if (draft.length === 0) {
    el.innerHTML = `<div class="empty">No draft questions yet.</div>`;
    return;
  }

  el.innerHTML = draft.map((q, i) => `
    <div class="post">
      <div class="row space">
        <div class="post-title">Q${i + 1}: ${q.text}</div>
        <button class="btn-mini" onclick="removeDraft(${i})">Remove</button>
      </div>
      <div class="post-body small muted">
        A) ${q.A} &nbsp; B) ${q.B} &nbsp; C) ${q.C} &nbsp; D) ${q.D}
        <br/>Correct: <b>${q.correct}</b>
      </div>
    </div>
  `).join("");
}

function addQuestionToDraft() {
  const text = document.getElementById("qText").value.trim();
  const A = document.getElementById("optA").value.trim();
  const B = document.getElementById("optB").value.trim();
  const C = document.getElementById("optC").value.trim();
  const D = document.getElementById("optD").value.trim();
  const correct = document.getElementById("correctOpt").value;

  if (!text || !A || !B || !C || !D) {
    alert("Please fill question + all options.");
    return;
  }

  const draft = readJSON(DRAFT_KEY, []);
  draft.push({ text, A, B, C, D, correct });
  writeJSON(DRAFT_KEY, draft);

  document.getElementById("qText").value = "";
  document.getElementById("optA").value = "";
  document.getElementById("optB").value = "";
  document.getElementById("optC").value = "";
  document.getElementById("optD").value = "";

  renderDraft();
}

function removeDraft(i) {
  const draft = readJSON(DRAFT_KEY, []);
  draft.splice(i, 1);
  writeJSON(DRAFT_KEY, draft);
  renderDraft();
}

function clearDraft() {
  writeJSON(DRAFT_KEY, []);
  renderDraft();
}

/* -------- Quizzes -------- */
function getQuizzes() {
  return readJSON(QUIZ_KEY, []);
}
function saveQuizzes(q) {
  writeJSON(QUIZ_KEY, q);
}

function createQuiz() {
  const title = document.getElementById("quizTitle").value.trim();
  const module = document.getElementById("quizModule").value.trim();
  const draft = readJSON(DRAFT_KEY, []);

  if (!title) return alert("Please enter quiz title.");
  if (draft.length === 0) return alert("Add at least 1 question to draft first.");

  const quizzes = getQuizzes();
  quizzes.unshift({
    id: uid(),
    title,
    module,
    createdAt: new Date().toISOString(),
    questions: draft
  });

  saveQuizzes(quizzes);
  clearDraft();

  document.getElementById("quizTitle").value = "";
  document.getElementById("quizModule").value = "";

  renderQuizzes();
  alert("Quiz created!");
}

function deleteQuiz(id) {
  const quizzes = getQuizzes().filter(q => q.id !== id);
  saveQuizzes(quizzes);
  renderQuizzes();
}

function renderQuizzes() {
  const el = document.getElementById("quizList");
  const quizzes = getQuizzes();

  if (quizzes.length === 0) {
    el.innerHTML = `<div class="empty">No quizzes yet. Create one above.</div>`;
    return;
  }

  el.innerHTML = quizzes.map(q => `
    <div class="post">
      <div class="row space">
        <div class="post-title">${q.title}</div>
        <button class="btn-mini" onclick="deleteQuiz('${q.id}')">Delete</button>
      </div>
      <div class="post-body small muted">
        Module: <b>${q.module || "-"}</b> • Questions: <b>${q.questions.length}</b>
        <br/>Created: ${new Date(q.createdAt).toLocaleString()}
      </div>
    </div>
  `).join("");
}

function seedDemoQuizzes() {
  const demo = [
    {
      id: uid(),
      title: "Intro Quiz",
      module: "Start here",
      createdAt: new Date().toISOString(),
      questions: [
        { text: "What is OOP?", A:"A language", B:"A programming paradigm", C:"A database", D:"A browser", correct:"B" }
      ]
    }
  ];
  saveQuizzes(demo);
  renderQuizzes();
  writeJSON(DRAFT_KEY, []);
  renderDraft();
}

renderDraft();
renderQuizzes();
