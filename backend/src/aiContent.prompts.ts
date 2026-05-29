export function personalizedExplanationPrompt(input: {
  topic: string;
  strugglingWith: string;
  format: string;
  profile: {
    name?: string;
    goal: string;
    currentLevel: string;
    language: string;
    learningStyles: string[];
    weakAreas: string[];
    strongAreas: string[];
  };
}) {
  return `
Create a personalized learning explanation.

Student profile:
- Name: ${input.profile.name || "Student"}
- Goal domain: ${input.profile.goal}
- Level: ${input.profile.currentLevel}
- Preferred language: ${input.profile.language}
- Learning styles: ${input.profile.learningStyles.join(", ")}
- Weak areas: ${input.profile.weakAreas.join(", ") || "unknown"}
- Strong areas: ${input.profile.strongAreas.join(", ") || "unknown"}

Learning request:
- Topic: ${input.topic}
- Student is struggling with: ${input.strugglingWith}
- Requested format: ${input.format}

Rules:
- Match the student's language preference.
- Use goal-domain examples.
- Beginner: explain with analogies and small steps.
- Expert: skip basics and focus on edge cases and mental models.
- If format is mixed, include text, visual, code, practice, and realWorldExample.
- Visual must be a short animation spec, not an image file.
- Practice must include 5 problems from easy to hard.
- Keep content accurate, concise, and safe for a learning app.

Return strict JSON:
{
  "explanation": "string",
  "visual": { "type": "call_stack|diagram|timeline|flow", "title": "string", "steps": ["string"] },
  "codeExample": "string",
  "practiceProblems": [{ "difficulty": "easy|medium|hard", "prompt": "string", "hint": "string" }],
  "realWorldExample": "string",
  "estimatedTime": "string"
}
`;
}
