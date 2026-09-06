'use client';

import React from 'react';
import { MODULE_ARTICLES, TASK_GUIDES } from '../../lib/documentation/helpData';
import { X, HelpCircle, ArrowRight, CheckCircle2, BookOpen, ExternalLink, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../ui/Button';

interface ContextualHelpDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  topic?: string; // e.g. 'products', 'sales', 'purchases', 'inventory', 'finance', 'work-orders', 'reports'
}

export function ContextualHelpDrawer({ isOpen, onClose, topic = 'products' }: ContextualHelpDrawerProps) {
  if (!isOpen) return null;

  // Find matching article or task guide based on topic key
  const article = MODULE_ARTICLES.find(
    (a) => a.id.toLowerCase().includes(topic.toLowerCase()) || a.category.toLowerCase().includes(topic.toLowerCase())
  ) || MODULE_ARTICLES[0];

  const relatedTasks = TASK_GUIDES.filter(
    (t) => t.category.toLowerCase().includes(topic.toLowerCase()) || t.keywords.some((k) => k.includes(topic.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Drawer Sheet */}
      <aside className="relative w-full max-w-lg h-full flex flex-col bg-card border-l border-border shadow-2xl animate-in slide-in-from-right duration-200 z-10">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-secondary/30">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <HelpCircle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-foreground">In-App Guide</h2>
              <p className="text-[11px] text-muted-foreground">{article.categoryLabel}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close help drawer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 custom-scrollbar text-xs">
          {/* Article Purpose Header */}
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-2">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              {article.title}
            </h3>
            <p className="text-muted-foreground leading-relaxed">{article.purpose}</p>
          </div>

          {/* When to use */}
          <div className="space-y-2">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              When Should I Use This?
            </h4>
            <ul className="space-y-1.5 pl-1">
              {article.whenToUse.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Step-by-Step Instructions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground text-xs uppercase tracking-wider text-muted-foreground">
              Step-by-Step Instructions
            </h4>
            <div className="space-y-2.5">
              {article.steps.map((s) => (
                <div key={s.stepNumber} className="rounded-lg border border-border/80 bg-secondary/20 p-3 space-y-1">
                  <div className="flex items-center gap-2 font-semibold text-foreground">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-[10px]">
                      {s.stepNumber}
                    </span>
                    <span>{s.title}</span>
                  </div>
                  <p className="text-muted-foreground pl-7 leading-normal">{s.action}</p>
                  {s.details && (
                    <p className="text-[11px] text-muted-foreground/80 pl-7 font-mono">{s.details}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Helpful Tip */}
          {article.tips && article.tips.length > 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 flex items-start gap-2.5 text-amber-200">
              <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-300">Pro Tip:</strong>
                <p className="text-[11px] mt-0.5">{article.tips[0]}</p>
              </div>
            </div>
          )}

          {/* Related Quick Task Guides */}
          {relatedTasks.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/60">
              <h4 className="font-semibold text-foreground text-xs">Common How-To Guides</h4>
              <div className="space-y-1.5">
                {relatedTasks.slice(0, 3).map((t) => (
                  <Link
                    key={t.id}
                    href={`/help?search=${encodeURIComponent(t.title)}`}
                    onClick={onClose}
                    className="flex items-center justify-between p-2 rounded-lg border border-border/60 hover:bg-secondary/40 transition-colors text-muted-foreground hover:text-foreground group"
                  >
                    <span className="font-medium text-[11px]">{t.title}</span>
                    <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Link to Full Help Center */}
        <div className="p-3 border-t border-border bg-secondary/30 shrink-0 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Need complete documentation?</span>
          <Link href="/help" onClick={onClose}>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs">
              <span>Open Help Center</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </aside>
    </div>
  );
}
