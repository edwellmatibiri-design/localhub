export type BookingQuestionType = "text" | "number" | "choice" | "photo";

export type BookingQuestion = {
  id?: number;
  key: string;
  category: string;
  question: string;
  type: BookingQuestionType;
  choices?: string[];
  required: boolean;
  orderIndex: number;
  condition?: (answers: Record<string, unknown>) => boolean;
};

const TREE_FELLING_QUESTIONS: BookingQuestion[] = [
  {
    key: "tree_height",
    category: "tree_felling",
    question: "What is the approximate tree height (in meters)?",
    type: "number",
    required: true,
    orderIndex: 1,
  },
  {
    key: "number_of_trees",
    category: "tree_felling",
    question: "How many trees need work?",
    type: "number",
    required: true,
    orderIndex: 2,
  },
  {
    key: "access_difficulty",
    category: "tree_felling",
    question: "Is access difficult?",
    type: "choice",
    choices: ["yes", "no"],
    required: true,
    orderIndex: 3,
  },
  {
    key: "access_description",
    category: "tree_felling",
    question: "Please describe the access constraints.",
    type: "text",
    required: true,
    orderIndex: 4,
    condition: (answers) =>
      String(answers.access_difficulty ?? "").toLowerCase() === "yes",
  },
  {
    key: "disposal_needed",
    category: "tree_felling",
    question: "Do you need debris disposal?",
    type: "choice",
    choices: ["yes", "no"],
    required: true,
    orderIndex: 5,
  },
  {
    key: "equipment_access_possible",
    category: "tree_felling",
    question: "If tree height is above 10m, is equipment access possible?",
    type: "choice",
    choices: ["yes", "no", "not sure"],
    required: true,
    orderIndex: 6,
    condition: (answers) => Number(answers.tree_height ?? 0) > 10,
  },
  {
    key: "site_photos",
    category: "tree_felling",
    question: "Upload site photos",
    type: "photo",
    required: false,
    orderIndex: 7,
  },
];

const CLEANING_QUESTIONS: BookingQuestion[] = [
  {
    key: "home_size",
    category: "cleaning",
    question: "What is the home size in square meters?",
    type: "number",
    required: true,
    orderIndex: 1,
  },
  {
    key: "rooms",
    category: "cleaning",
    question: "How many rooms need cleaning?",
    type: "number",
    required: true,
    orderIndex: 2,
  },
  {
    key: "pets",
    category: "cleaning",
    question: "Are there pets in the home?",
    type: "choice",
    choices: ["yes", "no"],
    required: true,
    orderIndex: 3,
  },
  {
    key: "frequency",
    category: "cleaning",
    question: "How often do you need cleaning?",
    type: "choice",
    choices: ["once_off", "weekly", "bi_weekly", "monthly"],
    required: true,
    orderIndex: 4,
  },
  {
    key: "room_photos",
    category: "cleaning",
    question: "Upload photos of high-priority areas",
    type: "photo",
    required: false,
    orderIndex: 5,
  },
];

const PLUMBING_QUESTIONS: BookingQuestion[] = [
  {
    key: "issue_type",
    category: "plumbing",
    question: "What plumbing issue are you experiencing?",
    type: "choice",
    choices: ["leak", "blocked_drain", "burst_pipe", "install", "other"],
    required: true,
    orderIndex: 1,
  },
  {
    key: "severity",
    category: "plumbing",
    question: "How severe is the issue?",
    type: "choice",
    choices: ["low", "medium", "high"],
    required: true,
    orderIndex: 2,
  },
  {
    key: "location",
    category: "plumbing",
    question: "Where is the issue located?",
    type: "text",
    required: true,
    orderIndex: 3,
  },
  {
    key: "urgency",
    category: "plumbing",
    question: "How urgent is this job?",
    type: "choice",
    choices: ["today", "this_week", "flexible"],
    required: true,
    orderIndex: 4,
  },
  {
    key: "damage_photos",
    category: "plumbing",
    question: "Upload photos of the issue",
    type: "photo",
    required: false,
    orderIndex: 5,
  },
];

function getDefaultQuestions(category: string) {
  const normalized = String(category ?? "")
    .trim()
    .toLowerCase();
  if (normalized === "tree_felling") return TREE_FELLING_QUESTIONS;
  if (normalized === "cleaning") return CLEANING_QUESTIONS;
  if (normalized === "plumbing") return PLUMBING_QUESTIONS;
  return PLUMBING_QUESTIONS;
}

function hasAnswer(answers: Record<string, unknown>, key: string) {
  const value = answers[key];
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "number") return Number.isFinite(value);
  return String(value ?? "").trim().length > 0;
}

export function getNextBestQuestion(input: {
  category: string;
  previousAnswers: Record<string, unknown>;
  questions?: BookingQuestion[];
}) {
  const category = String(input.category ?? "")
    .trim()
    .toLowerCase();
  const previousAnswers = input.previousAnswers ?? {};
  const questions = [
    ...(input.questions ?? getDefaultQuestions(category)),
  ].sort((a, b) => a.orderIndex - b.orderIndex);

  for (const question of questions) {
    if (question.condition && !question.condition(previousAnswers)) continue;
    if (!hasAnswer(previousAnswers, question.key)) return question;
  }

  return null;
}

export function getQuestionSet(category: string) {
  return getDefaultQuestions(category).map((question) => ({ ...question }));
}
