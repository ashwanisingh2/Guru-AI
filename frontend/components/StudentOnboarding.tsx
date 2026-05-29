"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { api, trackEvent } from "@/lib/api";

type Language = "en" | "hi" | "hinglish" | "es" | "ar";
type Goal = "full_stack" | "data_scientist" | "ai_engineer" | "cybersecurity" | "cloud_architect";
type Level = "beginner" | "some_coding" | "experienced" | "professional";
type LearningStyle = "video" | "reading" | "coding" | "projects";
type Mentor = "strict_sir" | "supportive_didi" | "chill_friend" | "corporate_senior";

export type StudentOnboardingForm = {
  language: Language;
  goal: Goal;
  level: Level;
  background_note: string;
  daily_minutes: number;
  learning_styles: LearningStyle[];
  mentor: Mentor;
};

export type StudentDnaProfile = StudentOnboardingForm & {
  pace: "light" | "steady" | "intensive";
  welcome_message: string;
  created_at: string;
};

type AuthSession = {
  token: string;
  user: { id: string; full_name: string; email: string };
};

const languages = [
  { value: "en", label: "English", flag: "🇺🇸" },
  { value: "hi", label: "Hindi", flag: "🇮🇳" },
  { value: "hinglish", label: "Hinglish", flag: "🇮🇳" },
  { value: "es", label: "Spanish", flag: "🇪🇸" },
  { value: "ar", label: "Arabic", flag: "🇸🇦" }
] as const;

const goals = [
  { value: "full_stack", icon: "▣", label: "Full-Stack Developer", desc: "Build complete web apps." },
  { value: "data_scientist", icon: "∑", label: "Data Scientist", desc: "Analyze data and build models." },
  { value: "ai_engineer", icon: "◇", label: "AI Engineer", desc: "Create AI products and agents." },
  { value: "cybersecurity", icon: "⌁", label: "Cybersecurity Expert", desc: "Secure systems and networks." },
  { value: "cloud_architect", icon: "☁", label: "Cloud Architect", desc: "Design scalable cloud infra." }
] as const;

const levels = [
  { value: "beginner", label: "Beginner", follow: "We'll start from fundamentals." },
  { value: "some_coding", label: "Some Coding", follow: "We'll strengthen weak areas first." },
  { value: "experienced", label: "Experienced", follow: "We'll move faster with projects." },
  { value: "professional", label: "Professional", follow: "We'll focus on mastery and interviews." }
] as const;

const styles = [
  { value: "video", label: "Video lectures" },
  { value: "reading", label: "Reading" },
  { value: "coding", label: "Hands-on Coding" },
  { value: "projects", label: "Project-based" }
] as const;

const mentors = [
  { value: "strict_sir", label: "Strict Sir", desc: "No excuses. Results only." },
  { value: "supportive_didi", label: "Supportive Didi", desc: "I'm here for you, we'll do this together." },
  { value: "chill_friend", label: "Chill Friend", desc: "Bro, let's code and chill." },
  { value: "corporate_senior", label: "Corporate Senior", desc: "Industry-ready, interview-focused." }
] as const;

const goalMap: Record<Goal, "fullstack" | "datascience" | "ai" | "cybersecurity" | "cloud"> = {
  full_stack: "fullstack",
  data_scientist: "datascience",
  ai_engineer: "ai",
  cybersecurity: "cybersecurity",
  cloud_architect: "cloud"
};

const levelMap: Record<Level, "beginner" | "intermediate" | "advanced" | "expert"> = {
  beginner: "beginner",
  some_coding: "intermediate",
  experienced: "advanced",
  professional: "expert"
};

const styleMap: Record<LearningStyle, "video" | "reading" | "coding" | "project"> = {
  video: "video",
  reading: "reading",
  coding: "coding",
  projects: "project"
};

const mentorMap: Record<Mentor, "strict" | "supportive" | "chill" | "corporate"> = {
  strict_sir: "strict",
  supportive_didi: "supportive",
  chill_friend: "chill",
  corporate_senior: "corporate"
};

function defaultLanguage(): Language {
  if (typeof navigator === "undefined") return "en";
  const locale = navigator.language.toLowerCase();
  if (locale.startsWith("hi")) return "hi";
  if (locale.startsWith("es")) return "es";
  if (locale.startsWith("ar")) return "ar";
  return "en";
}

function buildProfile(data: StudentOnboardingForm): StudentDnaProfile {
  const pace = data.daily_minutes < 60 ? "light" : data.daily_minutes < 180 ? "steady" : "intensive";
  const goal = goals.find((item) => item.value === data.goal)?.label || "CS student";
  const mentor = mentors.find((item) => item.value === data.mentor)?.label || "GURU";
  return {
    ...data,
    pace,
    welcome_message: `Welcome to GURU. Your ${goal} path is ready. ${mentor} will guide you with a ${pace} pace.`,
    created_at: new Date().toISOString()
  };
}

export function StudentOnboarding() {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<StudentDnaProfile | null>(null);
  const [auth, setAuth] = useState<AuthSession | null>(null);
  const [authForm, setAuthForm] = useState({ fullName: "", email: "", password: "" });
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [error, setError] = useState("");
  const form = useForm<StudentOnboardingForm>({
    defaultValues: {
      language: defaultLanguage(),
      daily_minutes: 90,
      learning_styles: []
    }
  });

  const values = form.watch();
  const selectedLevel = levels.find((item) => item.value === values.level);
  const recommendation = useMemo(() => {
    if ((values.daily_minutes || 0) < 60) return "Light path: 1 topic/day";
    if ((values.daily_minutes || 0) < 180) return "Steady path: lesson + practice daily";
    return "Intensive path: projects + assessments daily";
  }, [values.daily_minutes]);

  useEffect(() => {
    const savedAuth = localStorage.getItem("guru_auth");
    if (savedAuth) setAuth(JSON.parse(savedAuth) as AuthSession);
    const saved = localStorage.getItem("guru_onboarding");
    if (saved) {
      const parsed = JSON.parse(saved) as { step: number; values: StudentOnboardingForm };
      setStep(parsed.step);
      form.reset(parsed.values);
    }
  }, [form]);

  useEffect(() => {
    localStorage.setItem("guru_onboarding", JSON.stringify({ step, values }));
  }, [step, values]);

  async function next(fields: (keyof StudentOnboardingForm)[]) {
    const ok = await form.trigger(fields);
    if (ok) setStep((current) => Math.min(current + 1, 6));
  }

  async function signup() {
    setError("");
    try {
      const session = await api<AuthSession>(authMode === "signup" ? "/api/auth/signup" : "/api/auth/login", {
        method: "POST",
        body: authMode === "signup" ? { ...authForm, preferredLanguage: values.language || "en" } : { email: authForm.email, password: authForm.password }
      });
      localStorage.setItem("guru_auth", JSON.stringify(session));
      setAuth(session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Auth failed");
    }
  }

  async function complete() {
    const ok = await form.trigger();
    if (!ok) return;
    const student_dna_profile = buildProfile(form.getValues());
    const dnaInput = {
      userId: auth?.user.id || "11111111-1111-1111-1111-111111111111",
      language: student_dna_profile.language,
      goal: goalMap[student_dna_profile.goal],
      currentLevel: levelMap[student_dna_profile.level],
      dailyTimeMinutes: student_dna_profile.daily_minutes,
      learningStyles: student_dna_profile.learning_styles.map((style) => styleMap[style]),
      mentorPersonality: mentorMap[student_dna_profile.mentor],
      weakAreas: [],
      strongAreas: [],
      preferredStudyTime: "evening"
    };
    await api("/api/student/dna", {
      method: "POST",
      token: auth?.token,
      body: dnaInput
    });
    localStorage.removeItem("guru_onboarding");
    setProfile(student_dna_profile);
    trackEvent("onboarding_completed", "onboarding", { goal: student_dna_profile.goal, level: student_dna_profile.level });
  }

  const panel = "rounded border border-[#1f2937] bg-[#111827] p-4 text-left transition hover:border-[#4ade80]/60";
  const active = "border-[#4ade80] bg-[#052e16]/50 shadow-[0_0_24px_rgba(74,222,128,0.14)]";

  if (profile) {
    return (
      <div className="mx-auto max-w-3xl rounded border border-[#1f2937] bg-[#111827] p-6">
        <h1 className="text-2xl font-semibold">Student DNA Profile</h1>
        <p className="mt-3 text-[#4ade80]">{profile.welcome_message}</p>
        <pre className="mt-5 overflow-auto rounded bg-[#0a0c14] p-4 font-mono text-xs text-[#f9fafb]">
          {JSON.stringify({ student_dna_profile: profile }, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <form className="mx-auto max-w-4xl">
      <div className="mb-6 h-[3px] rounded bg-[#1f2937]">
        <div className="h-full rounded bg-gradient-to-r from-[#166534] to-[#4ade80]" style={{ width: `${((step + 1) / 7) * 100}%` }} />
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={step}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.22 }}
          className="rounded border border-[#1f2937] bg-[#0b0f19] p-6"
        >
          {step === 0 && (
            <>
              <h1 className="text-2xl font-semibold">Select Language</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {languages.map((item) => (
                  <label key={item.value} className={`${panel} ${values.language === item.value ? active : ""}`}>
                    <input className="sr-only" type="radio" value={item.value} {...form.register("language", { required: true })} />
                    <span className="text-2xl">{item.flag}</span>
                    <span className="ml-3 font-semibold">{item.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h1 className="text-2xl font-semibold">What do you want to become?</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {goals.map((item) => (
                  <label key={item.value} className={`${panel} ${values.goal === item.value ? active : ""}`}>
                    <input className="sr-only" type="radio" value={item.value} {...form.register("goal", { required: true })} />
                    <div className="font-mono text-xl text-[#4ade80]">{item.icon}</div>
                    <div className="mt-2 font-semibold">{item.label}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">{item.desc}</div>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-semibold">Your current level?</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {levels.map((item) => (
                  <label key={item.value} className={`${panel} ${values.level === item.value ? active : ""}`}>
                    <input className="sr-only" type="radio" value={item.value} {...form.register("level", { required: true })} />
                    <div className="font-semibold">{item.label}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">{item.follow}</div>
                  </label>
                ))}
              </div>
              {selectedLevel && (
                <input
                  className="mt-5 w-full rounded border border-[#1f2937] bg-[#111827] px-4 py-3 text-sm outline-none"
                  placeholder={selectedLevel.follow}
                  {...form.register("background_note")}
                />
              )}
            </>
          )}

          {step === 3 && (
            <>
              <h1 className="text-2xl font-semibold">How much time can you dedicate daily?</h1>
              <div className="mt-8 rounded border border-[#1f2937] bg-[#111827] p-5">
                <input className="w-full accent-[#4ade80]" type="range" min={30} max={360} step={30} {...form.register("daily_minutes", { valueAsNumber: true })} />
                <div className="mt-4 flex justify-between font-mono text-sm">
                  <span>{values.daily_minutes || 90} min/day</span>
                  <span className="text-[#4ade80]">{recommendation}</span>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <>
              <h1 className="text-2xl font-semibold">How do you learn best?</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {styles.map((item) => (
                  <label key={item.value} className={`${panel} ${values.learning_styles?.includes(item.value) ? active : ""}`}>
                    <input className="sr-only" type="checkbox" value={item.value} {...form.register("learning_styles", { required: true })} />
                    <span className="font-semibold">{item.label}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 5 && (
            <>
              <h1 className="text-2xl font-semibold">Choose your mentor style:</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {mentors.map((item) => (
                  <label key={item.value} className={`${panel} ${values.mentor === item.value ? active : ""}`}>
                    <input className="sr-only" type="radio" value={item.value} {...form.register("mentor", { required: true })} />
                    <div className="font-semibold">{item.label}</div>
                    <div className="mt-1 text-sm text-[#6b7280]">{item.desc}</div>
                  </label>
                ))}
              </div>
            </>
          )}

          {step === 6 && (
            <>
              <h1 className="text-2xl font-semibold">Confirm Your Journey</h1>
              <p className="mt-2 text-sm text-[#6b7280]">Testing mode: account optional. You can start directly.</p>
              {!auth && (
                <div className="mt-5 grid gap-3 rounded border border-[#1f2937] bg-[#111827] p-4 sm:grid-cols-3">
                  <div className="flex gap-2 sm:col-span-3">
                    <button type="button" onClick={() => setAuthMode("signup")} className={`rounded border px-3 py-2 text-sm ${authMode === "signup" ? "border-[#4ade80] text-[#4ade80]" : "border-[#1f2937]"}`}>Create Account</button>
                    <button type="button" onClick={() => setAuthMode("login")} className={`rounded border px-3 py-2 text-sm ${authMode === "login" ? "border-[#4ade80] text-[#4ade80]" : "border-[#1f2937]"}`}>Login</button>
                  </div>
                  {authMode === "signup" && <input className="rounded border border-[#1f2937] bg-[#0a0c14] px-3 py-2 text-sm outline-none" placeholder="Full name" value={authForm.fullName} onChange={(e) => setAuthForm({ ...authForm, fullName: e.target.value })} />}
                  <input className="rounded border border-[#1f2937] bg-[#0a0c14] px-3 py-2 text-sm outline-none" placeholder="Email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} />
                  <input className="rounded border border-[#1f2937] bg-[#0a0c14] px-3 py-2 text-sm outline-none" placeholder="Password" type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} />
                  <button type="button" onClick={signup} className="rounded bg-[#4ade80] px-4 py-2 font-mono text-sm font-bold text-[#052e16] sm:col-span-3">
                    {authMode === "signup" ? "Create Account" : "Login"}
                  </button>
                  {error && <div className="text-sm text-[#f59e0b] sm:col-span-3">{error}</div>}
                </div>
              )}
              {auth && <p className="mt-4 text-sm text-[#4ade80]">Account ready: {auth.user.email}</p>}
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#6b7280]">Goal</div>
                  <div className="mt-2 font-semibold">{goals.find((item) => item.value === values.goal)?.label}</div>
                </div>
                <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#6b7280]">Level</div>
                  <div className="mt-2 font-semibold">{levels.find((item) => item.value === values.level)?.label}</div>
                </div>
                <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#6b7280]">Daily Time</div>
                  <div className="mt-2 font-semibold">{values.daily_minutes || 90} min/day</div>
                </div>
                <div className="rounded border border-[#1f2937] bg-[#111827] p-4">
                  <div className="font-mono text-xs uppercase tracking-[0.18em] text-[#6b7280]">Mentor</div>
                  <div className="mt-2 font-semibold">{mentors.find((item) => item.value === values.mentor)?.label}</div>
                </div>
              </div>
            </>
          )}
        </motion.section>
      </AnimatePresence>

      <div className="mt-5 flex justify-between">
        <button type="button" disabled={step === 0} onClick={() => setStep((s) => s - 1)} className="rounded border border-[#1f2937] px-4 py-2 text-sm disabled:opacity-40">
          Back
        </button>
        {step < 6 ? (
          <button
            type="button"
            onClick={() => next([["language"], ["goal"], ["level"], ["daily_minutes"], ["learning_styles"], ["mentor"]][step] as (keyof StudentOnboardingForm)[])}
            className="rounded bg-[#4ade80] px-4 py-2 font-mono text-sm font-bold text-[#052e16]"
          >
            Next
          </button>
        ) : (
          <button type="button" onClick={complete} className="rounded bg-[#4ade80] px-5 py-3 font-mono text-sm font-bold text-[#052e16]">
            Start Directly
          </button>
        )}
      </div>
    </form>
  );
}
