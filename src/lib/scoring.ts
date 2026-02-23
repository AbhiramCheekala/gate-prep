export type QuestionType = "MCQ" | "NAT" | "MSQ";

export function computeScore(
  questionType: QuestionType,
  marks: number,
  correctAnswer: any,
  studentResponse: any
): number {
  if (studentResponse === undefined || studentResponse === null || (Array.isArray(studentResponse) && studentResponse.length === 0)) {
    return 0;
  }

  switch (questionType) {
    case "MCQ": {
      if (studentResponse === correctAnswer) {
        return marks;
      } else {
        return marks === 1 ? -0.33 : -0.67;
      }
    }
    case "NAT": {
      const response = parseFloat(studentResponse);
      const { min, max } = correctAnswer;
      if (response >= min && response <= max) {
        return marks;
      } else {
        return 0;
      }
    }
    case "MSQ": {
      const studentSet = new Set(studentResponse as string[]);
      const correctSet = new Set(correctAnswer as string[]);
      
      if (studentSet.size !== correctSet.size) return 0;
      for (const item of studentSet) {
        if (!correctSet.has(item)) return 0;
      }
      return marks;
    }
    default:
      return 0;
  }
}
