import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CheckCircle2,
  ChevronRight,
  Activity,
  Users,
  ShieldCheck,
  BrainCircuit,
  GitBranch,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import Button from '../components/common/Button';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Contribution Tracking',
      description:
        'Track manual contributions and commits, mapping their actual workload impact dynamically.',
      icon: Activity,
      color: 'bg-blue-50 text-blue-600 ring-blue-100',
    },
    {
      title: 'Peer Analytics',
      description:
        'Review interactive charts mapping progress shares and identifying inactive team members.',
      icon: BarChart3,
      color: 'bg-sky-50 text-sky-600 ring-sky-100',
    },
    {
      title: 'AI Progress Summaries',
      description:
        'Generate smart rule-based textual status and next-action reports to stay aligned.',
      icon: BrainCircuit,
      color: 'bg-purple-50 text-purple-600 ring-purple-100',
    },
    {
      title: 'Deadline Risk Engine',
      description:
        'Predict scheduling conflicts and bottlenecks before they cause project delivery slips.',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-600 ring-emerald-100',
    },
    {
      title: 'GitHub Integration',
      description:
        'Connect your GitHub repository and automatically sync commit activity into contribution scores.',
      icon: GitBranch,
      color: 'bg-slate-50 text-slate-700 ring-slate-200',
    },
    {
      title: 'Team Management',
      description:
        'Invite collaborators, assign roles, and monitor individual workload distribution in real-time.',
      icon: Users,
      color: 'bg-amber-50 text-amber-600 ring-amber-100',
    },
  ];


  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col">
      {/* ── Navbar ────────────────────────────────────────── */}
      <header className="px-6 lg:px-16 h-16 flex items-center justify-between border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-sky-400 shadow-sm">
            <Zap className="text-white" size={16} />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            SyncScore <span className="gradient-text">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/register')}>
            Get Started
            <ChevronRight size={15} className="ml-1" />
          </Button>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="flex flex-col justify-center items-center px-6 py-20 lg:py-28 text-center max-w-5xl mx-auto animate-fadeInUp">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-xs text-blue-700 font-semibold mb-8">
            <Zap size={12} />
            AI-Powered Project Intelligence — Now Live
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
            Know who is really{' '}
            <span className="gradient-text">contributing</span>
            <br />
            — not just who talks the most.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-500 max-w-2xl leading-relaxed">
            SyncScore AI tracks real contributions, tasks, inactive members, and deadline
            risks — giving teams absolute clarity on work distribution.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Button
              variant="primary"
              onClick={() => navigate('/register')}
              className="text-base px-7 py-3 shadow-md hover:shadow-lg"
            >
              Create Free Account
              <ArrowRight size={17} className="ml-1.5" />
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/login')}
              className="text-base px-7 py-3"
            >
              Access Dashboard
            </Button>
          </div>
        </section>

        {/* ── Problem Statement ──────────────────────────── */}
        <section className="py-16 bg-slate-50 border-y border-slate-100">
          <div className="max-w-4xl mx-auto px-6">
            <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-card text-left flex flex-col sm:flex-row gap-6 items-start">
              <div className="flex-shrink-0 rounded-2xl bg-blue-50 ring-1 ring-blue-100 p-4 text-blue-600">
                <ShieldCheck size={28} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2">The Problem We Solve</h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  In collaborative work, a few team members often carry the entire workload while
                  others take credit. Standard trackers measure tasks but miss actual contribution
                  weight, code depth, and active participation. SyncScore AI analyzes task completion
                  speed, commit logs, and logged impact points to score exact contribution
                  percentages objectively.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features Grid ─────────────────────────────── */}
        <section className="py-20 px-6 max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
              Core Platform Capabilities
            </h2>
            <p className="mt-3 text-base text-slate-500 max-w-xl mx-auto">
              Everything your team needs to track contributions fairly and ship on time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="card-hover flex gap-4 p-6 rounded-2xl border border-slate-200 bg-white shadow-card"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <div className={`rounded-xl ring-1 p-3 h-12 w-12 flex items-center justify-center shrink-0 ${feature.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{feature.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── CTA Banner ────────────────────────────────── */}
        <section className="py-20 px-6 bg-gradient-to-br from-blue-600 to-sky-500">
          <div className="max-w-3xl mx-auto text-center text-white">
            <h2 className="text-3xl font-extrabold tracking-tight mb-4">
              Ready to see who's really doing the work?
            </h2>
            <p className="text-blue-100 mb-8 text-base">
              Join thousands of teams using SyncScore AI to track contributions objectively.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate('/register')}
              className="border-white text-white hover:bg-white hover:text-blue-600 text-base px-8 py-3 font-bold"
            >
              Get Started Free
              <ArrowRight size={17} className="ml-1.5" />
            </Button>
          </div>
        </section>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-white py-8 px-6 text-center text-xs text-slate-400">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="flex items-center justify-center h-6 w-6 rounded-md bg-gradient-to-br from-blue-600 to-sky-400">
            <Zap className="text-white" size={12} />
          </div>
          <span className="font-semibold text-slate-600">SyncScore AI</span>
        </div>
        &copy; {new Date().getFullYear()} SyncScore AI. Designed for modern engineering teams and sprint projects.
      </footer>
    </div>
  );
};

export default Landing;
