import React, { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  BrainCircuit,
  BriefcaseBusiness,
  ChevronRight,
  CircleCheck,
  CloudUpload,
  Download,
  FileText,
  Gauge,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  TrendingUp,
  UploadCloud,
  UsersRound,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";

import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { cn } from "./lib/utils";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "upload", label: "Upload Resumes", icon: UploadCloud },
  { id: "screening", label: "AI Screening", icon: BrainCircuit },
  { id: "candidates", label: "Top Candidates", icon: UsersRound },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
  { id: "settings", label: "Settings", icon: Settings },
];

const initialCandidates = [];

const performanceData = [
  { day: "Mon", accuracy: 86, latency: 2.4 },
  { day: "Tue", accuracy: 88, latency: 2.2 },
  { day: "Wed", accuracy: 91, latency: 1.9 },
  { day: "Thu", accuracy: 90, latency: 1.8 },
  { day: "Fri", accuracy: 93, latency: 1.7 },
];

const chartColors = ["#3B82F6", "#22C55E", "#F59E0B", "#06B6D4"];
const API_BASE_URL = "http://127.0.0.1:8000";

function uploadWithProgress(url, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      const percent = Math.round((event.loaded / event.total) * 82) + 18;
      onProgress(Math.min(99, percent));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100);
        resolve(request.responseText);
        return;
      }

      try {
        const error = JSON.parse(request.responseText);
        reject(new Error(error.detail || "Resume upload failed."));
      } catch {
        reject(new Error("Resume upload failed."));
      }
    };

    request.onerror = () => reject(new Error("Cannot reach the backend. Start FastAPI on port 8000."));
    request.open("POST", url);
    request.send(formData);
  });
}

function mapApiCandidate(candidate) {
  const matchedSkills = candidate.matched_skills?.length ? candidate.matched_skills : ["AI Match"];

  return {
    name: candidate.candidate_name || candidate.source_file || "Unknown Candidate",
    role: candidate.category || "Uploaded Resume",
    score: Math.round(candidate.final_percentage || 0),
    semantic: Math.round((candidate.semantic_score || 0) * 100),
    probability: Math.round(candidate.ml_probability || 0),
    ranking: `#${candidate.rank}`,
    status: candidate.final_percentage >= 90 ? "Shortlist" : candidate.final_percentage >= 80 ? "Interview" : "Review",
    skills: matchedSkills.map((skill) => skill.toString()),
    education: "Extracted from uploaded resume",
    experience: "Review the original resume file for detailed experience.",
    analysis: `AI ranked this candidate at ${candidate.final_percentage}% based on semantic similarity, skill overlap, and ML probability.`,
    sourceFile: candidate.source_file || "",
  };
}

function formatBytes(bytes) {
  if (!bytes) return "0 KB";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadState, setUploadState] = useState(0);
  const [activeSection, setActiveSection] = useState("dashboard");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [jobDescription, setJobDescription] = useState(
    "Looking for a Machine Learning Engineer with Python, Docker, AWS, Terraform, Kubernetes and NLP ranking experience.",
  );
  const [candidateResults, setCandidateResults] = useState(initialCandidates);
  const [screeningError, setScreeningError] = useState("");

  React.useEffect(() => {
    document.documentElement.classList.toggle("light", !isDark);
  }, [isDark]);

  const stats = useMemo(() => {
    const total = candidateResults.length;
    const topMatches = candidateResults.filter((c) => c.score >= 80).length;
    const avgScore = total ? Math.round(candidateResults.reduce((acc, c) => acc + c.score, 0) / total) : 0;
    
    return [
      { label: "Total Screened Resumes", value: total.toString(), delta: "Current Session", icon: FileText, tone: "blue" },
      { label: "Top Matches", value: topMatches.toString(), delta: "Score >= 80", icon: Target, tone: "green" },
      { label: "Average Match Score", value: `${avgScore}%`, delta: "Overall Avg", icon: Gauge, tone: "amber" },
      { label: "AI Processing Time", value: isProcessing ? "..." : "1.2s", delta: "Live Inference", icon: Zap, tone: "cyan" },
    ];
  }, [candidateResults, isProcessing]);

  const extractedSkills = useMemo(() => {
    const text = jobDescription.toLowerCase();
    const skills = [
      "python", "java", "javascript", "typescript", "react", "node", "express",
      "django", "flask", "fastapi", "sql", "mysql", "postgresql", "mongodb",
      "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "git", "linux",
      "machine learning", "deep learning", "nlp", "pandas", "numpy", "scikit-learn",
      "tensorflow", "pytorch", "html", "css", "tailwind", "rest api", "graphql", "ci/cd"
    ];
    return skills
      .filter(skill => text.includes(skill))
      .map(skill => skill.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
  }, [jobDescription]);

  const runScreening = async () => {
    setScreeningError("");

    if (!uploadedFiles.length) {
      setScreeningError("Please upload at least one PDF or DOCX resume first.");
      navigateToSection("upload");
      return;
    }

    if (!jobDescription.trim()) {
      setScreeningError("Please paste a job description before screening.");
      navigateToSection("screening");
      return;
    }

    setIsProcessing(true);
    setUploadState(18);

    try {
      const formData = new FormData();
      formData.append("job_description", jobDescription);
      formData.append("top_n", "20");
      formData.append("required_skills", extractedSkills.join(","));
      uploadedFiles.forEach((file) => formData.append("files", file));

      const response = await uploadWithProgress(`${API_BASE_URL}/api/screen/upload`, formData, setUploadState);
      const data = JSON.parse(response);

      setCandidateResults(data.results.map(mapApiCandidate));
      setActiveSection("candidates");
      window.setTimeout(() => {
        document.getElementById("candidates")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (error) {
      setScreeningError(error.message || "Upload failed. Please make sure the backend is running on port 8000.");
    } finally {
      setIsProcessing(false);
    }
  };

  const navigateToSection = (sectionId) => {
    setActiveSection(sectionId);
    setSidebarOpen(false);

    if (sectionId === "settings") {
      setSettingsOpen(true);
      return;
    }

    const section = document.getElementById(sectionId);
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: "var(--bg)", color: "var(--fg)" }}>
      <div className="relative z-10 flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          activeSection={activeSection}
          onClose={() => setSidebarOpen(false)}
          onNavigate={navigateToSection}
        />

        <main className="min-w-0 flex-1 lg:pl-64">
          <TopNav onMenu={() => setSidebarOpen(true)} isDark={isDark} onToggleTheme={() => setIsDark(d => !d)} />

          <section id="dashboard" className="hero-section px-6 pt-8 pb-6" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex flex-col gap-3 max-w-2xl">
              <span className="pill pill-blue self-start">
                <Sparkles className="h-3 w-3" />
                Live AI Screening Workspace
              </span>
              <h1 className="hero-title">
                Recruitment Intelligence
              </h1>
              <p className="text-sm leading-6" style={{ color: "var(--subtle)" }}>
                Screen, rank and shortlist candidates instantly using AI semantic matching and ML probability scoring.
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button onClick={runScreening} className="btn-primary shimmer-btn">
                  {isProcessing ? <LoaderText /> : <><Zap className="h-4 w-4" /> Run AI Screening</>}
                </button>
                <button className="btn-secondary">
                  <ShieldCheck className="h-4 w-4" /> View Pipeline
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {["Semantic model online", "Embeddings cache active", "Bias check enabled"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5"
                  style={{ border: "1px solid var(--border)", background: "var(--surface2)" }}>
                  <CircleCheck className="h-4 w-4 shrink-0" style={{ color: "var(--success)" }} />
                  <span className="text-xs font-medium" style={{ color: "var(--subtle)" }}>{item}</span>
                </div>
              ))}
            </div>
          </section>

          <StatsGrid stats={stats} />

          <section className="p-6 grid gap-5 items-stretch xl:grid-cols-[0.9fr_1.1fr]">
            <div id="upload" className="scroll-mt-28 h-full">
              <UploadPanel
                files={uploadedFiles}
                progress={uploadState}
                error={screeningError}
                onFilesSelected={(files) => {
                  setUploadedFiles(files);
                  setUploadState(files.length ? 100 : 0);
                  setScreeningError("");
                }}
              />
            </div>
            <div id="screening" className="scroll-mt-28 h-full">
              <JobDescriptionPanel
                skills={extractedSkills}
                value={jobDescription}
                onChange={setJobDescription}
                onRun={runScreening}
                isProcessing={isProcessing}
              />
            </div>
          </section>

          {candidateResults.length > 0 && (
            <>
              <section className="px-6 pb-2 pt-6 scroll-mt-20" id="candidates">
                <ResultsTable candidates={candidateResults} onSelect={setSelectedCandidate} />
              </section>
              <section className="px-6 pb-6 scroll-mt-20" id="analytics">
                <AnalyticsSection candidates={candidateResults} />
              </section>
            </>
          )}
        </main>
      </div>

      <CandidatePanel candidate={selectedCandidate} onClose={() => setSelectedCandidate(null)} />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

function Sidebar({ open, activeSection, onClose, onNavigate }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 flex flex-col transition-transform duration-200 lg:translate-x-0 sidebar",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-[1.1rem] sidebar-header">
          <div className="logo-icon grid h-8 w-8 place-items-center">
            <BrainCircuit className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--fg)" }}>HireMind AI</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Recruitment Intelligence</p>
          </div>
          <button className="ml-auto rounded p-1 text-muted hover:text-foreground lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
          <p className="section-label px-3 pb-2.5">Navigation</p>
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => onNavigate(item.id)}
              className={cn("nav-item", activeSection === item.id && "active")}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-status px-4 py-4">
          <div className="flex items-center gap-2">
            <div className="status-dot status-dot-green" />
            <p className="text-xs font-medium text-foreground">AI Engine Online</p>
          </div>
          <p className="mt-1 text-xs text-muted">Semantic + ML ranking active</p>
        </div>
      </aside>
    </>
  );
}

function TopNav({ onMenu, isDark, onToggleTheme }) {
  return (
    <header className="topnav flex items-center gap-3 px-5 py-3">
      <button className="btn-icon lg:hidden" onClick={onMenu}>
        <Menu className="h-4 w-4" />
      </button>
      <div className="hidden min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-sm md:flex"
        style={{ border: "1px solid var(--border)", background: "var(--surface2)", color: "var(--muted)" }}>
        <Search className="h-4 w-4 shrink-0" />
        <input className="w-full bg-transparent outline-none placeholder:opacity-60" style={{ color: "var(--fg)" }} placeholder="Search candidates, skills..." />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <span className="pill pill-green hidden sm:inline-flex">
          <span className="status-dot status-dot-green" /> AI Live
        </span>
        <button className="btn-icon" onClick={onToggleTheme} title={isDark ? "Switch to light mode" : "Switch to dark mode"}>
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
        <button className="btn-icon">
          <Bell className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ border: "1px solid var(--border)", background: "var(--surface2)" }}>
          <div className="grid h-7 w-7 place-items-center rounded text-xs font-bold text-white" style={{ background: "var(--accent)" }}>RJ</div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold" style={{ color: "var(--fg)" }}>Recruiter Jamal</p>
            <p className="text-2xs" style={{ color: "var(--muted)" }}>Talent Lead</p>
          </div>
        </div>
      </div>
    </header>
  );
}

function StatsGrid({ stats }) {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      className="grid gap-4 px-6 py-5 border-b border-border sm:grid-cols-2 xl:grid-cols-4"
    >
      {stats.map((stat) => (
        <div key={stat.label} className="accent-card p-4 flex items-start gap-3">
          <div className="icon-grad grid h-9 w-9 shrink-0 place-items-center rounded-lg">
            <stat.icon className="h-4 w-4" style={{ color: "var(--accent)" }} />
          </div>
          <div className="min-w-0">
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tracking-tight" style={{ color: "var(--fg)" }}>{stat.value}</p>
            <span className="pill pill-neutral mt-1.5">{stat.delta}</span>
          </div>
        </div>
      ))}
    </motion.section>
  );
}

function UploadPanel({ files, progress, error, onFilesSelected }) {
  const inputRef = useRef(null);

  const handleFiles = (fileList) => {
    const selected = Array.from(fileList || []).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".docx");
    });
    onFilesSelected(selected);
  };

  return (
    <div className="pro-card overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <CloudUpload className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Resume Upload</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted">PDF or DOCX — drop files below</p>
      </div>
      <div className="p-5 flex-1">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={(event) => handleFiles(event.target.files)}
        />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => { event.preventDefault(); handleFiles(event.dataTransfer.files); }}
        className={`drop-zone grid cursor-pointer place-items-center text-center transition-all ${files.length ? "py-5 px-4" : "min-h-40 p-6"}`}
      >
        <div>
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-border bg-background">
            <UploadCloud className="h-5 w-5 text-accent" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            {files.length ? `${files.length} file${files.length > 1 ? "s" : ""} selected` : "Drop resumes here"}
          </p>
          <p className="mt-0.5 text-xs text-muted">PDF or DOCX · Click to browse</p>
          {!files.length && (
            <div className="mt-4 progress-bar-track w-40 mx-auto">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {files.map((file) => (
            <div key={`${file.name}-${file.size}`} className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-3.5 w-3.5 shrink-0 text-accent" />
                <span className="truncate text-xs text-foreground">{file.name}</span>
              </div>
              <span className="text-2xs text-muted ml-2 shrink-0">{formatBytes(file.size)}</span>
            </div>
          ))}
        </div>
      )}
      {error && (
        <div className="mt-3 rounded-lg border border-danger/30 bg-danger/8 px-3 py-2.5 text-xs text-red-300">
          {error}
        </div>
      )}
      </div>
    </div>
  );
}

function JobDescriptionPanel({ skills, value, onChange, onRun, isProcessing }) {
  return (
    <div className="pro-card overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <WandSparkles className="h-4 w-4 text-accent" />
          <h2 className="text-sm font-semibold text-foreground">Job Description</h2>
        </div>
        <p className="mt-0.5 text-xs text-muted">Paste requirements to extract skill signals</p>
      </div>
      <div className="p-5 flex-1">
        <div className="rounded-lg border border-border bg-background p-3 transition focus-within:border-accent/60">
          <textarea
            className="min-h-36 w-full resize-none bg-transparent text-sm leading-6 text-foreground outline-none placeholder:text-muted"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Paste job description here..."
          />
        </div>
        {skills.length > 0 && (
          <div className="mt-4">
            <p className="section-label mb-2">Detected Skills</p>
            <div className="flex flex-wrap gap-1.5">
              {skills.map((skill) => (
                <span key={skill} className="pill pill-blue">{skill}</span>
              ))}
            </div>
          </div>
        )}
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 px-3 py-2.5">
          <BrainCircuit className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs text-subtle">Semantic model active — signals detected from your description.</p>
        </div>
        <button onClick={onRun} className="btn-primary shimmer-btn mt-4 w-full justify-center">
          {isProcessing ? <LoaderText /> : <><Zap className="h-4 w-4" /> Run AI Screening</>}
        </button>
      </div>
    </div>
  );
}

function ResultsTable({ candidates, onSelect }) {
  return (
    <div className="pro-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <UsersRound className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-semibold text-foreground">AI Candidate Ranking</h2>
          </div>
          <p className="mt-0.5 text-xs text-muted">Top matches sorted by final score</p>
        </div>
        <span className="pill pill-blue">{candidates.length} candidates</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] text-left">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Candidate","Score","Skills","Semantic","ML Prob.","Rank","Status"].map(h => (
                <th key={h} className="px-4 py-3" style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.09em", textTransform: "uppercase", color: "var(--muted)", textAlign: "left" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((candidate) => (
              <tr
                key={candidate.name}
                onClick={() => onSelect(candidate)}
                className="table-row text-sm"
                style={{ color: "var(--fg)" }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold"
                      style={{ background: "var(--accent-lt)", color: "var(--accent)" }}>
                      {candidate.name.split(" ").filter(Boolean).map((p) => p[0]).join("").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate" style={{ color: "var(--fg)" }}>{candidate.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{candidate.role}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{candidate.score}%</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {candidate.skills.slice(0, 2).map((skill) => (
                      <span key={skill} className="pill pill-neutral">{skill}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="progress-bar-track w-20">
                      <div className="progress-bar-fill" style={{ width: `${candidate.semantic}%` }} />
                    </div>
                    <span className="text-xs" style={{ color: "var(--subtle)" }}>{candidate.semantic}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="progress-bar-track w-20">
                      <div className="progress-bar-fill green" style={{ width: `${candidate.probability}%` }} />
                    </div>
                    <span className="text-xs" style={{ color: "var(--subtle)" }}>{candidate.probability}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold" style={{ color: "var(--accent)" }}>{candidate.ranking}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={cn("pill", candidate.status === "Shortlist" ? "pill-green" : candidate.status === "Interview" ? "pill-blue" : "pill-neutral")}>
                      {candidate.status}
                    </span>
                    <ChevronRight className="h-3.5 w-3.5" style={{ color: "var(--muted)" }} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsSection({ candidates }) {
  const categoryData = useMemo(() => {
    if (!candidates || !candidates.length) return [{ name: "No Data", value: 1 }];
    const counts = {};
    candidates.forEach(c => {
      const role = c.role || "Other";
      counts[role] = (counts[role] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).slice(0, 4);
  }, [candidates]);

  const matchData = useMemo(() => {
    if (!candidates || !candidates.length) return [];
    const buckets = { "60": 0, "70": 0, "80": 0, "90": 0, "95": 0 };
    candidates.forEach(c => {
      if (c.score >= 95) buckets["95"]++;
      else if (c.score >= 90) buckets["90"]++;
      else if (c.score >= 80) buckets["80"]++;
      else if (c.score >= 70) buckets["70"]++;
      else buckets["60"]++;
    });
    return Object.entries(buckets).map(([bucket, count]) => ({ bucket, count }));
  }, [candidates]);

  const skillsData = useMemo(() => {
    if (!candidates || !candidates.length) return [];
    const counts = {};
    candidates.forEach(c => {
      (c.skills || []).forEach(s => {
        counts[s] = (counts[s] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .map(([skill, value]) => ({ skill, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [candidates]);

  const pipelineData = useMemo(() => {
    if (!candidates || !candidates.length) return [];
    const screened = candidates.length;
    const matched = candidates.filter(c => c.score >= 70).length;
    const shortlisted = candidates.filter(c => c.score >= 90).length;
    return [
      { stage: "Screened", value: screened },
      { stage: "Matched", value: matched },
      { stage: "Short.", value: shortlisted },
    ];
  }, [candidates]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MiniChart title="Category Distribution" type="pie" data={categoryData} />
      <MiniChart title="Top Skills" type="bar" data={skillsData} />
      <MiniChart title="Candidate Pipeline" type="line" data={pipelineData} />
      <MiniChart title="Match Score Distribution" type="bars" data={matchData} />
    </div>
  );
}

function MiniChart({ title, type, data }) {
  return (
    <div className="pro-card p-4">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <div className="mt-3 h-36">
        <ResponsiveContainer width="100%" height="100%">
          {type === "pie" ? (
            <PieChart>
              <Pie data={data} innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value">
                {data.map((_, index) => (
                  <Cell key={index} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          ) : type === "line" ? (
            <LineChart data={data}>
              <XAxis dataKey="stage" stroke="#4B5563" tickLine={false} axisLine={false} fontSize={10} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="value" stroke="#22C55E" strokeWidth={2} dot={false} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <XAxis dataKey={type === "bar" ? "skill" : "bucket"} stroke="#4B5563" tickLine={false} axisLine={false} fontSize={10} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey={type === "bar" ? "value" : "count"} radius={[4, 4, 0, 0]} fill={type === "bar" ? "#4F6EF7" : "#F59E0B"} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function CandidatePanel({ candidate, onClose }) {
  return (
    <AnimatePresence>
      {candidate && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60"
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed bottom-0 right-0 top-0 z-[70] w-full overflow-y-auto border-l border-border bg-surface sm:w-[440px]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg text-sm font-semibold" 
                  style={{ background: "var(--accent-lt)", color: "var(--accent)" }}>
                  {candidate.name.split(" ").filter(Boolean).map((p) => p[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{candidate.name}</h2>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{candidate.role}</p>
                </div>
              </div>
              <button className="rounded p-1.5 hover:bg-black/5" style={{ color: "var(--muted)" }} onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="pro-card p-3">
                  <p className="text-2xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>Semantic</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color: "var(--fg)" }}>{candidate.semantic}%</p>
                </div>
                <div className="pro-card p-3">
                  <p className="text-2xs uppercase tracking-wide" style={{ color: "var(--muted)" }}>ML Probability</p>
                  <p className="mt-1 text-xl font-semibold" style={{ color: "var(--fg)" }}>{candidate.probability}%</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[["Skills", <div className="flex flex-wrap gap-1.5">{candidate.skills.map(s => <span key={s} className="pill pill-blue">{s}</span>)}</div>],
                  ["AI Analysis", <p className="text-xs leading-6" style={{ color: "var(--subtle)" }}>{candidate.analysis}</p>],
                  ["Education", <p className="text-xs leading-6" style={{ color: "var(--subtle)" }}>{candidate.education}</p>],
                  ["Experience", <p className="text-xs leading-6" style={{ color: "var(--subtle)" }}>{candidate.experience}</p>]
                ].map(([title, content]) => (
                  <div key={title} className="pro-card p-4">
                    <p className="section-label mb-2" style={{ color: "var(--muted)" }}>{title}</p>
                    {content}
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingsPanel({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-[60] bg-black/60" />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="fixed bottom-0 right-0 top-0 z-[70] w-full overflow-y-auto border-l border-border bg-surface sm:w-[420px]"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Settings</h2>
                <p className="mt-0.5 text-xs text-muted">Screening preferences</p>
              </div>
              <button className="rounded p-1.5 text-muted hover:text-foreground" onClick={onClose}>
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <SettingRow title="Auto-rank new uploads" description="Run scoring as soon as resumes arrive." enabled />
              <SettingRow title="Semantic-first ranking" description="Prioritize meaning over keyword overlap." enabled />
              <SettingRow title="Bias safety checks" description="Flag sensitive ranking signals." enabled />
              <SettingRow title="Email shortlist summary" description="Send summaries after each batch." />
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function SettingRow({ title, description, enabled = false }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4">
      <div>
        <p className="text-xs font-semibold text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted">{description}</p>
      </div>
      <div className={cn("flex h-6 w-10 items-center rounded-full p-0.5 transition shrink-0", enabled ? "bg-accent" : "bg-border")}>
        <span className={cn("h-5 w-5 rounded-full bg-white shadow transition", enabled ? "translate-x-4" : "translate-x-0")} />
      </div>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/[0.07]">
            <Icon className="h-5 w-5 text-blue-200" />
          </div>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <p className="mt-2 text-sm text-slate-400">{subtitle}</p>
      </div>
    </div>
  );
}

// CircularScore is no longer used in the table (replaced by plain text score)
// Kept for backward compatibility with CandidatePanel if needed
function CircularScore({ value }) {
  return <span className="text-sm font-semibold text-foreground">{value}%</span>;
}

// Progress kept for backward compat but unused — table uses inline progress bars
function Progress({ value, color = "blue" }) {
  return (
    <div className="flex items-center gap-2">
      <div className="progress-bar-track w-24">
        <div className={cn("progress-bar-fill", color === "green" && "green")} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-muted">{value}%</span>
    </div>
  );
}

function DetailMetric({ label, value }) {
  return (
    <div className="pro-card p-3">
      <p className="text-2xs text-muted uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return (
    <section className="mt-3 pro-card p-4">
      <p className="section-label mb-2">{title}</p>
      {children}
    </section>
  );
}

function LoaderText() {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      Screening
    </span>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="font-semibold text-foreground">{label || payload[0].name}</p>
      <p className="text-muted">{payload[0].value}</p>
    </div>
  );
}

export default App
