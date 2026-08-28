'use client';

import React, { useState } from 'react';
import { Navbar } from '../../../components/layout/Navbar';
import { Sidebar } from '../../../components/layout/Sidebar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmService } from '../../../services/crmService';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Tag as TagIcon, Plus, Edit2, Ban, Check, Search, AlertCircle } from 'lucide-react';

export default function TagsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<{ id: string; name: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const { data: tagsData, isLoading, error } = useQuery({
    queryKey: ['tags', activeTab],
    queryFn: () => crmService.getTags(activeTab),
  });

  const rawTags = (tagsData as any)?.data || (Array.isArray(tagsData) ? tagsData : []);
  const tags = rawTags.filter((t: any) =>
    searchQuery ? t.name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const createMutation = useMutation({
    mutationFn: (name: string) => crmService.createTag({ name, type: activeTab }),
    onSuccess: () => {
      setNewTagName('');
      queryClient.invalidateQueries({ queryKey: ['tags', activeTab] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to create tag');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; name: string }) =>
      crmService.updateTag(payload.id, { name: payload.name }),
    onSuccess: () => {
      setEditingTag(null);
      queryClient.invalidateQueries({ queryKey: ['tags', activeTab] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to update tag');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => crmService.deactivateTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags', activeTab] });
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Failed to deactivate tag');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    setErrorMsg('');
    createMutation.mutate(newTagName.trim());
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-8 space-y-6 max-w-5xl mx-auto w-full">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
              <TagIcon className="h-7 w-7 text-primary" />
              Tag Management
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Create and manage classification tags for customers and suppliers.
            </p>
          </div>

          {errorMsg && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs font-medium text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Type Selector Tabs */}
          <div className="flex items-center justify-between border-b border-border/80 pb-2">
            <div className="flex items-center gap-2">
              <Button
                variant={activeTab === 'CUSTOMER' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('CUSTOMER');
                  setErrorMsg('');
                }}
                className="text-xs"
              >
                Customer Tags
              </Button>
              <Button
                variant={activeTab === 'SUPPLIER' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => {
                  setActiveTab('SUPPLIER');
                  setErrorMsg('');
                }}
                className="text-xs"
              >
                Supplier Tags
              </Button>
            </div>

            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-8 text-xs"
              />
            </div>
          </div>

          {/* Create New Tag Card */}
          <Card className="border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Create New {activeTab} Tag</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="flex items-center gap-3">
                <Input
                  placeholder={`e.g. ${activeTab === 'CUSTOMER' ? 'VIP, Wholesale, Architect, High Priority' : 'Raw Timber, Hardware, Premium Fabric'}`}
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="max-w-md text-xs"
                />
                <Button size="sm" type="submit" disabled={!newTagName.trim() || createMutation.isPending}>
                  <Plus className="h-4 w-4 mr-1" />
                  {createMutation.isPending ? 'Creating...' : 'Create Tag'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Tags List */}
          <Card className="border-border/80">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Existing {activeTab} Tags</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-10 bg-card/60 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : tags.length === 0 ? (
                <div className="text-center py-8 space-y-2">
                  <TagIcon className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  <p className="text-sm font-medium text-muted-foreground">
                    No {activeTab.toLowerCase()} tags found.
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Create tags above to organize your {activeTab.toLowerCase()} accounts.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 border border-border/60 rounded-lg overflow-hidden">
                  {tags.map((t: any) => {
                    const usageCount = (t._count?.customers || 0) + (t._count?.suppliers || 0);
                    const isEditing = editingTag?.id === t.id;

                    return (
                      <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-secondary/20 transition-colors text-xs">
                        {isEditing && editingTag ? (
                          <div className="flex items-center gap-2 flex-1 max-w-sm">
                            <Input
                              value={editingTag.name}
                              onChange={(e) => setEditingTag({ id: editingTag.id, name: e.target.value })}
                              className="h-8 text-xs"
                            />
                            <Button
                              size="sm"
                              className="h-8 px-2.5 text-xs"
                              onClick={() => updateMutation.mutate({ id: t.id, name: editingTag.name })}
                              disabled={updateMutation.isPending}
                            >
                              <Check className="h-3.5 w-3.5 mr-1" /> Save
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => setEditingTag(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-foreground text-sm">{t.name}</span>
                            <Badge variant={t.isActive ? 'default' : 'secondary'} className="text-[10px]">
                              {t.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              Used by {usageCount} account(s)
                            </span>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex items-center gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="hover:bg-primary/20 hover:text-primary transition-colors"
                              title="Edit Tag"
                              onClick={() => setEditingTag({ id: t.id, name: t.name })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {t.isActive && (
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/15 transition-colors"
                                title="Deactivate Tag"
                                onClick={() => deactivateMutation.mutate(t.id)}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
