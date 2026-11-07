/**
 * CBT MMIS v2 Configuration & Scoring Utilities
 */

export interface CbtExamConfig {
  is_cbt_v2: boolean;
  target_classes: string[]; // e.g. ["7A", "7B"] or empty for all
  schedule_start: string | null; // ISO timestamp
  schedule_end: string | null; // ISO timestamp
  token_enabled: boolean;
  token_code: string;
  require_webcam: boolean;
  exam_rules: string;
  statement_text: string;
  points_correct: number; // default +4
  penalty_wrong: number; // default -1 (pengurangan skor)
  show_score: boolean; // default true
  show_explanation: boolean; // default false
  max_tab_exits: number; // default 3
}

export const DEFAULT_CBT_CONFIG: CbtExamConfig = {
  is_cbt_v2: true,
  target_classes: [],
  schedule_start: null,
  schedule_end: null,
  token_enabled: false,
  token_code: "",
  require_webcam: false,
  exam_rules: "1. Ujian wajib dikerjakan secara mandiri dan jujur.\n2. Dilarang berpindah tab atau aplikasi lain. Toleransi maksimal keluar tab adalah 3 kali sebelum ujian otomatis disubmit.\n3. Periksa kembali jawaban sebelum mengumpulkan.",
  statement_text: "Saya menyatakan bersedia mengerjakan ujian ini secara jujur, mandiri tanpa bantuan pihak lain, tidak membuka tab/aplikasi lain, dan mematuhi tata tertib CBT MMIS v2. Saya memahami jika keluar tab sebanyak 3 kali, ujian akan otomatis dikumpulkan.",
  points_correct: 4,
  penalty_wrong: 1,
  show_score: true,
  show_explanation: false,
  max_tab_exits: 3,
};

const CONFIG_MARKER_START = "<!-- CBT_MMIS_V2_CONFIG:";
const CONFIG_MARKER_END = ":END_CBT_CONFIG -->";

/**
 * Parses CBT configuration from a quiz record.
 * Supports both dedicated columns and JSON block embedded in description / cbt_config.
 */
export function parseCbtConfig(quiz: any): CbtExamConfig {
  if (!quiz) return { ...DEFAULT_CBT_CONFIG };

  let embeddedConfig: Partial<CbtExamConfig> = {};

  // 1. Try reading from cbt_config jsonb column
  if (quiz.cbt_config && typeof quiz.cbt_config === "object") {
    embeddedConfig = { ...quiz.cbt_config };
  }

  // 2. Try reading from description embedded JSON marker if present
  if (quiz.description && typeof quiz.description === "string" && quiz.description.includes(CONFIG_MARKER_START)) {
    try {
      const startIdx = quiz.description.indexOf(CONFIG_MARKER_START) + CONFIG_MARKER_START.length;
      const endIdx = quiz.description.indexOf(CONFIG_MARKER_END);
      if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
        const jsonStr = quiz.description.slice(startIdx, endIdx);
        const parsed = JSON.parse(jsonStr);
        embeddedConfig = { ...embeddedConfig, ...parsed };
      }
    } catch (e) {
      console.warn("Failed to parse embedded CBT config from description", e);
    }
  }

  // Combine with explicit database columns if they exist
  const isCbtV2 = 
    quiz.is_cbt_v2 !== undefined 
      ? Boolean(quiz.is_cbt_v2) 
      : embeddedConfig.is_cbt_v2 !== undefined 
        ? Boolean(embeddedConfig.is_cbt_v2) 
        : false;

  const targetClasses = 
    Array.isArray(quiz.target_classes) 
      ? quiz.target_classes 
      : Array.isArray(embeddedConfig.target_classes) 
        ? embeddedConfig.target_classes 
        : [];

  const scheduleStart = quiz.schedule_start || embeddedConfig.schedule_start || null;
  const scheduleEnd = quiz.schedule_end || embeddedConfig.schedule_end || null;
  const tokenEnabled = quiz.token_enabled ?? embeddedConfig.token_enabled ?? false;
  const tokenCode = quiz.token_code ?? embeddedConfig.token_code ?? "";
  const requireWebcam = quiz.require_webcam ?? embeddedConfig.require_webcam ?? false;
  const examRules = quiz.exam_rules ?? embeddedConfig.exam_rules ?? DEFAULT_CBT_CONFIG.exam_rules;
  const statementText = quiz.statement_text ?? embeddedConfig.statement_text ?? DEFAULT_CBT_CONFIG.statement_text;
  const pointsCorrect = Number(quiz.points_correct ?? embeddedConfig.points_correct ?? 4);
  const penaltyWrong = Number(quiz.penalty_wrong ?? embeddedConfig.penalty_wrong ?? 1);
  const showScore = quiz.show_score ?? embeddedConfig.show_score ?? true;
  const showExplanation = quiz.show_explanation ?? embeddedConfig.show_explanation ?? false;
  const maxTabExits = Number(quiz.max_tab_exits ?? embeddedConfig.max_tab_exits ?? 3);

  return {
    is_cbt_v2: isCbtV2,
    target_classes: targetClasses,
    schedule_start: scheduleStart,
    schedule_end: scheduleEnd,
    token_enabled: Boolean(tokenEnabled),
    token_code: String(tokenCode || ""),
    require_webcam: Boolean(requireWebcam),
    exam_rules: examRules,
    statement_text: statementText,
    points_correct: pointsCorrect,
    penalty_wrong: penaltyWrong,
    show_score: Boolean(showScore),
    show_explanation: Boolean(showExplanation),
    max_tab_exits: maxTabExits,
  };
}

/**
 * Cleans the raw description of any embedded config marker.
 */
export function getCleanDescription(rawDescription: string | null | undefined): string {
  if (!rawDescription) return "";
  const startIdx = rawDescription.indexOf(CONFIG_MARKER_START);
  const endIdx = rawDescription.indexOf(CONFIG_MARKER_END);
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const before = rawDescription.slice(0, startIdx);
    const after = rawDescription.slice(endIdx + CONFIG_MARKER_END.length);
    return (before + after).trim();
  }
  return rawDescription.trim();
}

/**
 * Serializes CBT config into description and object payload for Supabase update.
 */
export function serializeCbtPayload(cleanDescription: string, config: CbtExamConfig) {
  const serializedMarker = `${CONFIG_MARKER_START}${JSON.stringify(config)}${CONFIG_MARKER_END}\n\n`;
  const finalDescription = `${serializedMarker}${cleanDescription || ""}`.trim();

  return {
    description: finalDescription,
    show_score: config.show_score,
    show_explanation: config.show_explanation,
    // Extra fields to include in case columns exist
    is_cbt_v2: config.is_cbt_v2,
    target_classes: config.target_classes,
    schedule_start: config.schedule_start,
    schedule_end: config.schedule_end,
    token_enabled: config.token_enabled,
    token_code: config.token_code,
    require_webcam: config.require_webcam,
    exam_rules: config.exam_rules,
    statement_text: config.statement_text,
    points_correct: config.points_correct,
    penalty_wrong: config.penalty_wrong,
    cbt_config: config,
  };
}

/**
 * Checks if the exam schedule is currently active, upcoming, or ended.
 */
export function getExamScheduleStatus(config: CbtExamConfig, now: Date = new Date()): {
  status: "active" | "upcoming" | "ended";
  label: string;
  isAvailable: boolean;
  startsInMinutes?: number;
} {
  const currentTime = now.getTime();

  if (config.schedule_start) {
    const startTime = new Date(config.schedule_start).getTime();
    if (currentTime < startTime) {
      const diffMs = startTime - currentTime;
      const startsInMinutes = Math.max(1, Math.round(diffMs / 60000));
      return {
        status: "upcoming",
        label: "Belum Dimulai (Terjadwal)",
        isAvailable: false,
        startsInMinutes,
      };
    }
  }

  if (config.schedule_end) {
    const endTime = new Date(config.schedule_end).getTime();
    if (currentTime > endTime) {
      return {
        status: "ended",
        label: "Waktu Ujian Berakhir",
        isAvailable: false,
      };
    }
  }

  return {
    status: "active",
    label: "Sedang Tayang (Dapat Dikerjakan)",
    isAvailable: true,
  };
}

/**
 * Checks whether this exam targets the given student's class.
 */
export function isStudentClassTargeted(config: CbtExamConfig, studentClass: string | undefined | null): boolean {
  if (!config.target_classes || config.target_classes.length === 0) return true; // All classes
  if (!studentClass) return true; // Default allow if unknown
  return config.target_classes.includes(studentClass);
}

/**
 * Computes CBT score with positive points and negative penalties.
 */
export function calculateCbtScore(
  questions: any[],
  responses: Record<string, any>,
  config: CbtExamConfig
) {
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let positivePointsTotal = 0;
  let negativePointsTotal = 0;
  let maxPossibleScore = 0;

  const questionDetails = questions.map((q) => {
    // Determine question-specific positive points and negative penalty
    const qCorrectPoints = Number(
      q.points_correct ?? q.metadata?.points_correct ?? q.points ?? config.points_correct
    );
    const qPenaltyWrong = Number(
      q.penalty_wrong ?? q.metadata?.penalty_wrong ?? config.penalty_wrong
    );

    maxPossibleScore += qCorrectPoints;
    const userAns = responses[q.id];

    let isAnswered = false;
    let isCorrect = false;
    let earnedPoints = 0;

    if (q.question_type === "mcq") {
      const correctOpt = q.options?.find((o: any) => o.is_correct);
      const correctText = correctOpt?.text;

      if (userAns !== undefined && userAns !== null && userAns !== "") {
        isAnswered = true;
        if (userAns === correctText) {
          isCorrect = true;
          earnedPoints = qCorrectPoints;
          correctCount++;
          positivePointsTotal += qCorrectPoints;
        } else {
          isCorrect = false;
          earnedPoints = -qPenaltyWrong;
          wrongCount++;
          negativePointsTotal += qPenaltyWrong;
        }
      } else {
        isAnswered = false;
        earnedPoints = 0;
        unansweredCount++;
      }
    } else if (q.question_type === "complex_mcq") {
      const correctOpts = q.options?.filter((o: any) => o.is_correct).map((o: any) => o.text) || [];
      const userOpts = Array.isArray(userAns) ? userAns : [];

      if (userOpts.length > 0) {
        isAnswered = true;
        let correctSelections = 0;
        let incorrectSelections = 0;
        correctOpts.forEach((c: any) => { if (userOpts.includes(c)) correctSelections++; });
        userOpts.forEach((u: any) => { if (!correctOpts.includes(u)) incorrectSelections++; });

        if (correctSelections === correctOpts.length && incorrectSelections === 0) {
          isCorrect = true;
          earnedPoints = qCorrectPoints;
          correctCount++;
          positivePointsTotal += qCorrectPoints;
        } else {
          isCorrect = false;
          earnedPoints = -qPenaltyWrong;
          wrongCount++;
          negativePointsTotal += qPenaltyWrong;
        }
      } else {
        isAnswered = false;
        earnedPoints = 0;
        unansweredCount++;
      }
    } else if (q.question_type === "matching") {
      const userMatches = userAns || {};
      const totalPairs = q.options?.length || 1;
      let matchedCount = 0;

      if (Object.keys(userMatches).length > 0) {
        isAnswered = true;
        q.options?.forEach((o: any) => {
          if (userMatches[o.text] === o.match_pair) matchedCount++;
        });

        if (matchedCount === totalPairs) {
          isCorrect = true;
          earnedPoints = qCorrectPoints;
          correctCount++;
          positivePointsTotal += qCorrectPoints;
        } else {
          isCorrect = false;
          earnedPoints = -qPenaltyWrong;
          wrongCount++;
          negativePointsTotal += qPenaltyWrong;
        }
      } else {
        isAnswered = false;
        earnedPoints = 0;
        unansweredCount++;
      }
    } else {
      // Essay or other types: default to manual grading or neutral 0 until graded
      if (userAns !== undefined && userAns !== null && String(userAns).trim().length > 0) {
        isAnswered = true;
      } else {
        unansweredCount++;
      }
      earnedPoints = 0;
    }

    return {
      questionId: q.id,
      questionType: q.question_type,
      isAnswered,
      isCorrect,
      earnedPoints,
      qCorrectPoints,
      qPenaltyWrong,
      explanation: q.explanation || q.metadata?.explanation || null,
      audioUrl: q.audio_url || q.metadata?.audio_url || null,
      imageUrl: q.image_url || q.metadata?.image_url || null,
    };
  });

  const rawScore = positivePointsTotal - negativePointsTotal;
  // Scaled percentage score (between 0 and 100)
  const scaledScore = maxPossibleScore > 0 
    ? Math.max(0, Math.round((rawScore / maxPossibleScore) * 100)) 
    : 0;

  return {
    rawScore,
    scaledScore,
    maxPossibleScore,
    positivePointsTotal,
    negativePointsTotal,
    correctCount,
    wrongCount,
    unansweredCount,
    questionDetails,
  };
}

