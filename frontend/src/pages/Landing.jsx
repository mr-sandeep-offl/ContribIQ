import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, CheckCircle2, ChevronRight, Activity, Users, ShieldCheck, BrainCircuit } from 'lucide-react';
import Button from '../components/common/Button';

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Contribution Tracking',
      description: 'Track manual contributions and commits, mapping their actual workload impact dynamically.',
      icon: Activity,
    },
    {
      title: 'Peer Analytics',
      description: 'Review interactive charts mapping progress shares and identifying inactive team members.',
      icon: Users,
    },
    {
      title: 'AI Progress Summaries',
      description: 'Generate smart rule-based textual status and next-action reports to stay aligned.',
      icon: BrainCircuit,
    },
    {
      title: 'Deadline Risk Engine',
      description: 'Predict scheduling conflicts and bottlenecks before they cause project delivery slips.',
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar */}
      <header className="px-6 lg:px-16 h-20 flex items-center justify-between border-b border-gray-900 bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <Cpu className="text-indigo-500 h-6 w-6 animate-pulse" />
          <span className="text-xl font-bold tracking-tight">
            SyncScore <span className="text-indigo-400">AI</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </Button>
          <Button variant="primary" onClick={() => navigate('/register')}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-16 lg:py-24 text-center max-w-5xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-xs text-indigo-400 font-semibold mb-6">
          <Cpu size={14} />
          Now Live: AI-Powered Project Intelligence
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Know who is really contributing — <br />
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            not just who talks the most.
          </span>
        </h1>
        
        <p className="mt-6 text-lg sm:text-xl text-gray-400 max-w-2xl leading-relaxed">
          SyncScore AI tracks real contributions, tasks, inactive members, and deadline risks, giving teams absolute clarity on work distribution.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Button 
            variant="primary" 
            onClick={() => navigate('/register')}
            className="text-base px-6 py-3"
          >
            Create Free Account
            <ChevronRight size={18} className="ml-1" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate('/login')}
            className="text-base px-6 py-3"
          >
            Access Dashboard
          </Button>
        </div>

        {/* Problem Statement Card */}
        <div className="mt-16 w-full rounded-2xl border border-gray-900 bg-gray-900/30 p-8 text-left backdrop-blur-sm">
          <h2 className="text-lg font-bold text-white mb-2">The Problem We Solve</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            In collaborative work, it is common for a few team members to carry the workload while others take credit. Standard trackers measure tasks but miss actual contribution weight, code depth, and active participation. SyncScore AI analyzes task completion speed, commit logs, and logged impact points to score exact contribution percentages objectively.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-20 w-full">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-12">
            Core Platform Capabilities
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div key={i} className="flex gap-4 p-6 rounded-xl border border-gray-900 bg-gray-900/10">
                  <div className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 p-3 h-12 w-12 text-indigo-400 flex items-center justify-center shrink-0">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-gray-950 py-8 px-6 text-center text-xs text-gray-500">
        &copy; {new Date().getFullYear()} SyncScore AI. Designed for modern engineering classrooms and sprint teams.
      </footer>
    </div>
  );
};

export default Landing;
