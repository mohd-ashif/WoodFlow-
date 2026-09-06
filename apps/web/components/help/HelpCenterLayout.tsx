'use client';

import React, { useState, useMemo } from 'react';
import {
  SETUP_CHECKLIST,
  BUSINESS_WORKFLOWS,
  MODULE_ARTICLES,
  TASK_GUIDES,
  ROLE_GUIDES,
  GLOSSARY_TERMS,
  FAQ_ITEMS,
  DocArticle,
} from '../../lib/documentation/helpData';
import {
  Search,
  BookOpen,
  CheckCircle2,
  ListTodo,
  Layers,
  Users,
  HelpCircle,
  BookMarked,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  Package,
  ShoppingCart,
  ShoppingBag,
  Hammer,
  DollarSign,
  BarChart3,
  Building2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';

export function HelpCenterLayout() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<
    'getting-started' | 'workflows' | 'modules' | 'tasks' | 'roles' | 'glossary' | 'faq'
  >('getting-started');

  const [selectedModuleId, setSelectedModuleId] = useState<string>(MODULE_ARTICLES[0].id);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('OWNER');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Live real-time documentation search filtering across all data arrays
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchesTasks = TASK_GUIDES.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.summary.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.toLowerCase().includes(q))
    );

    const matchesArticles = MODULE_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.purpose.toLowerCase().includes(q)
    );

    const matchesFaq = FAQ_ITEMS.filter(
      (f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q)
    );

    const matchesGlossary = GLOSSARY_TERMS.filter(
      (g) => g.term.toLowerCase().includes(q) || g.definition.toLowerCase().includes(q)
    );

    return { tasks: matchesTasks, articles: matchesArticles, faq: matchesFaq, glossary: matchesGlossary };
  }, [searchQuery]);

  const activeArticle = useMemo(() => {
    return MODULE_ARTICLES.find((a) => a.id === selectedModuleId) || MODULE_ARTICLES[0];
  }, [selectedModuleId]);

  const activeRole = useMemo(() => {
    return ROLE_GUIDES.find((r) => r.role === selectedRoleId) || ROLE_GUIDES[0];
  }, [selectedRoleId]);

  const CATEGORY_TABS = [
    { id: 'getting-started', label: 'Getting Started', icon: CheckCircle2 },
    { id: 'workflows', label: 'Business Workflows', icon: Layers },
    { id: 'modules', label: 'Module Guides', icon: BookOpen },
    { id: 'tasks', label: 'Common Tasks', icon: ListTodo },
    { id: 'roles', label: 'Role-Based Guides', icon: Users },
    { id: 'glossary', label: 'ERP Glossary', icon: BookMarked },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ];

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">
      {/* ─── SEARCH & HERO HEADER ─────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-secondary/30 p-4 sm:p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="default" className="text-[11px]">
                ERP User Documentation
              </Badge>
              <span className="text-[11px] text-muted-foreground">Last updated: September 2026</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">
              Help & Documentation Center
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 max-w-2xl">
              Learn how to use FurnitureOS ERP, complete daily tasks, understand business workflows, and read executive reports.
            </p>
          </div>
        </div>

        {/* Live Search Input */}
        <div className="relative max-w-2xl">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder='Search guides (e.g. "How to create invoice", "How to add product", "How to record payment")...'
            className="pl-10 pr-10 h-11 text-xs sm:text-sm bg-card/80 border-border/80 rounded-xl shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-lg"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ─── LIVE SEARCH RESULTS VIEW (When searching) ───────────────────────── */}
      {searchResults ? (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">
              Search Results for &ldquo;{searchQuery}&rdquo;
            </h2>
            <Button size="sm" variant="ghost" onClick={() => setSearchQuery('')} className="text-xs">
              Clear Search
            </Button>
          </div>

          {searchResults.tasks.length === 0 &&
          searchResults.articles.length === 0 &&
          searchResults.faq.length === 0 &&
          searchResults.glossary.length === 0 ? (
            <div className="rounded-xl border border-border bg-card/40 p-8 text-center space-y-2">
              <HelpCircle className="h-8 w-8 text-muted-foreground/50 mx-auto" />
              <p className="font-semibold text-sm text-foreground">No matching guides found</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Try searching with simpler words like &ldquo;invoice&rdquo;, &ldquo;product&rdquo;, &ldquo;payment&rdquo;, or &ldquo;stock&rdquo;.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Task Guides Matches */}
              {searchResults.tasks.map((task) => (
                <div key={task.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">
                      {task.category} Task
                    </Badge>
                    <Link href={task.route}>
                      <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-primary">
                        <span>Open Feature</span>
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                  <h3 className="font-bold text-sm text-foreground">{task.title}</h3>
                  <p className="text-xs text-muted-foreground">{task.summary}</p>
                  <div className="pt-2 space-y-1">
                    <span className="text-[11px] font-semibold text-foreground">Steps:</span>
                    <ol className="list-decimal list-inside text-[11px] text-muted-foreground space-y-0.5">
                      {task.steps.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))}

              {/* Articles Matches */}
              {searchResults.articles.map((art) => (
                <div key={art.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                  <Badge variant="info" className="text-[10px]">
                    {art.categoryLabel}
                  </Badge>
                  <h3 className="font-bold text-sm text-foreground">{art.title}</h3>
                  <p className="text-xs text-muted-foreground">{art.summary}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedModuleId(art.id);
                      setActiveTab('modules');
                      setSearchQuery('');
                    }}
                    className="text-xs gap-1"
                  >
                    <span>Read Full Guide</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {/* FAQ Matches */}
              {searchResults.faq.map((faq) => (
                <div key={faq.id} className="rounded-xl border border-border bg-card p-4 space-y-1">
                  <Badge variant="secondary" className="text-[10px]">
                    FAQ
                  </Badge>
                  <h4 className="font-bold text-xs text-foreground">{faq.question}</h4>
                  <p className="text-xs text-muted-foreground">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ─── MAIN TABBED DOCUMENTATION VIEW ──────────────────────────────── */
        <div className="space-y-4">
          {/* Navigation Category Tabs (Horizontal Scroll on Mobile) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar border-b border-border/80 min-w-0">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: GETTING STARTED (Checklist) */}
          {activeTab === 'getting-started' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/20 bg-card p-4 sm:p-5 space-y-2">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  Recommended Setup Sequence
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Follow this 11-step checklist to configure your company, items, users, and accounts in the correct order for smooth daily operations.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SETUP_CHECKLIST.map((step) => (
                  <div
                    key={step.id}
                    className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary font-mono font-bold text-xs">
                          {step.id}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {step.roleRequired}
                        </Badge>
                      </div>
                      <h3 className="font-bold text-sm text-foreground">{step.title}</h3>
                      <p className="text-xs text-muted-foreground leading-normal">{step.description}</p>
                    </div>

                    <Link href={step.route} className="pt-2 border-t border-border/40">
                      <Button size="sm" variant="outline" className="w-full text-xs gap-1.5 justify-between">
                        <span>Go to Setup</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: BUSINESS WORKFLOWS */}
          {activeTab === 'workflows' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-card p-4 space-y-1">
                <h2 className="text-base font-bold text-foreground">Core ERP Business Workflows</h2>
                <p className="text-xs text-muted-foreground">
                  Understand how information flows across Sales, Purchases, Stock, Production, and Accounting.
                </p>
              </div>

              <div className="space-y-4">
                {BUSINESS_WORKFLOWS.map((wf) => (
                  <div key={wf.id} className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 space-y-4">
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-foreground">{wf.title}</h3>
                      <p className="text-xs text-muted-foreground">{wf.description}</p>
                    </div>

                    {/* Step Flow Diagram */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2.5">
                      {wf.steps.map((s) => (
                        <div
                          key={s.step}
                          className="rounded-lg border border-border/60 bg-secondary/20 p-3 space-y-1 relative flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-[10px] font-bold">
                              {s.step}
                            </span>
                            <Badge variant="secondary" className="text-[9px]">
                              {s.module}
                            </Badge>
                          </div>
                          <h4 className="font-bold text-xs text-foreground mt-1">{s.title}</h4>
                          <p className="text-[11px] text-muted-foreground leading-snug">{s.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: MODULE GUIDES */}
          {activeTab === 'modules' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* Module List Sidebar */}
              <div className="space-y-1.5 lg:col-span-1">
                {MODULE_ARTICLES.map((art) => (
                  <button
                    key={art.id}
                    onClick={() => setSelectedModuleId(art.id)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      selectedModuleId === art.id
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    <span>{art.title}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 ml-1" />
                  </button>
                ))}
              </div>

              {/* Module Article Detail View */}
              <div className="lg:col-span-3 rounded-xl border border-border/80 bg-card p-4 sm:p-6 space-y-5">
                <div className="space-y-2 border-b border-border/60 pb-4">
                  <Badge variant="default" className="text-[11px]">
                    {activeArticle.categoryLabel}
                  </Badge>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">{activeArticle.title}</h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {activeArticle.summary}
                  </p>

                  {/* Quick Action Links */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {activeArticle.quickActions.map((qa, idx) => (
                      <Link key={idx} href={qa.route}>
                        <Button size="sm" variant="outline" className="text-xs gap-1.5">
                          <span>{qa.label}</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Purpose */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-sm text-foreground uppercase tracking-wider text-muted-foreground text-xs">
                    Purpose & Overview
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground leading-relaxed bg-secondary/20 p-3.5 rounded-xl border border-border/60">
                    {activeArticle.purpose}
                  </p>
                </div>

                {/* When to use */}
                <div className="space-y-2">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    When Should I Use This Section?
                  </h3>
                  <ul className="space-y-1.5 pl-1">
                    {activeArticle.whenToUse.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Step-by-step */}
                <div className="space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
                    Step-by-Step Instructions
                  </h3>
                  <div className="space-y-2.5">
                    {activeArticle.steps.map((s) => (
                      <div key={s.stepNumber} className="rounded-xl border border-border/60 bg-secondary/15 p-3.5 space-y-1">
                        <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-foreground">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-xs">
                            {s.stepNumber}
                          </span>
                          <span>{s.title}</span>
                          <span className="text-xs font-normal text-muted-foreground ml-auto">{s.location}</span>
                        </div>
                        <p className="text-xs text-foreground pl-7 leading-normal">{s.action}</p>
                        {s.details && (
                          <p className="text-xs text-muted-foreground/80 pl-7 font-mono">{s.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* What Happens Next */}
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-1">
                  <h4 className="font-bold text-xs text-foreground">What Happens After Saving?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{activeArticle.whatHappensNext}</p>
                </div>

                {/* Pro Tips */}
                {activeArticle.tips && (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-1 text-amber-200">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-300">
                      <Lightbulb className="h-4 w-4 text-amber-400" /> Pro Tip
                    </div>
                    {activeArticle.tips.map((t, idx) => (
                      <p key={idx} className="text-xs text-amber-200/90 pl-6">
                        • {t}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: COMMON TASKS */}
          {activeTab === 'tasks' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TASK_GUIDES.map((task) => (
                <div key={task.id} className="rounded-xl border border-border/80 bg-card p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">
                        {task.category}
                      </Badge>
                      <Link href={task.route}>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-primary">
                          <span>Open Feature</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                    <h3 className="font-bold text-sm text-foreground">{task.title}</h3>
                    <p className="text-xs text-muted-foreground">{task.summary}</p>

                    <div className="pt-2 space-y-1">
                      <span className="text-xs font-semibold text-foreground">Instructions:</span>
                      <ol className="list-decimal list-inside text-xs text-muted-foreground space-y-1">
                        {task.steps.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ol>
                    </div>
                  </div>

                  {task.nextSteps && (
                    <p className="text-[11px] text-muted-foreground/80 italic pt-2 border-t border-border/40">
                      Result: {task.nextSteps}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 5: ROLE-BASED GUIDES */}
          {activeTab === 'roles' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5 lg:col-span-1">
                {ROLE_GUIDES.map((r) => (
                  <button
                    key={r.role}
                    onClick={() => setSelectedRoleId(r.role)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-between ${
                      selectedRoleId === r.role
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-card border-border/80 text-muted-foreground hover:text-foreground hover:bg-secondary/40'
                    }`}
                  >
                    <span>{r.roleTitle}</span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0" />
                  </button>
                ))}
              </div>

              <div className="lg:col-span-3 rounded-xl border border-border/80 bg-card p-4 sm:p-6 space-y-5">
                <div className="space-y-1 border-b border-border/60 pb-3">
                  <Badge variant="default" className="text-[10px]">
                    Role Guide
                  </Badge>
                  <h2 className="text-lg font-bold text-foreground">{activeRole.roleTitle}</h2>
                  <p className="text-xs text-muted-foreground">{activeRole.description}</p>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                    Primary Modules
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeRole.primaryModules.map((m, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {m}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-xs text-foreground uppercase tracking-wider text-muted-foreground">
                    Key Operating Responsibilities
                  </h3>
                  <ul className="space-y-1.5 pl-1">
                    {activeRole.keyTasks.map((t, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-foreground">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <h3 className="font-bold text-xs text-foreground">Recommended Daily Workflow</h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {activeRole.recommendedDailyRoutine.map((r, idx) => (
                      <p key={idx}>• {r}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: GLOSSARY */}
          {activeTab === 'glossary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {GLOSSARY_TERMS.map((item, idx) => (
                <div key={idx} className="rounded-xl border border-border/80 bg-card p-4 space-y-1.5">
                  <h3 className="font-bold text-sm text-foreground">{item.term}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.definition}</p>
                  {item.example && (
                    <p className="text-[11px] text-muted-foreground/80 italic font-mono pt-1">
                      Example: {item.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 7: FAQ */}
          {activeTab === 'faq' && (
            <div className="space-y-3 max-w-3xl">
              {FAQ_ITEMS.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                return (
                  <div key={faq.id} className="rounded-xl border border-border/80 bg-card overflow-hidden transition-colors">
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 text-xs sm:text-sm font-bold text-foreground hover:bg-secondary/20 transition-colors"
                    >
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {faq.category}
                        </Badge>
                        <span>{faq.question}</span>
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" /> : <ChevronDown className="h-4 w-4 shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3 space-y-2 animate-in fade-in duration-150">
                        <p>{faq.answer}</p>
                        {faq.relatedRoute && (
                          <Link href={faq.relatedRoute}>
                            <Button size="sm" variant="ghost" className="h-7 text-[11px] gap-1 text-primary p-0">
                              <span>Go to feature</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
