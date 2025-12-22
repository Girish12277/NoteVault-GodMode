import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Command as CommandPrimitive } from "cmdk";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import {
    Dialog,
    DialogContent
} from "@/components/ui/dialog";
import { BookOpen, School, Clock, ShoppingCart, LayoutDashboard, Search, Trash2, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useDebounce } from '@/hooks/useDebounce';
import api from '@/lib/api';

interface OmniSearchProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const RECENT_SEARCHES_KEY = 'omni_recent_searches';
const MAX_RECENT = 5;

export const OmniSearch: React.FC<OmniSearchProps> = ({ open, onOpenChange }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [recents, setRecents] = useState<string[]>([]);
    const debouncedQuery = useDebounce(query, 300);

    // Load Recents
    useEffect(() => {
        try {
            const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
            if (stored) {
                setRecents(JSON.parse(stored));
            }
        } catch (e) {
            console.error("Failed to load recent searches", e);
        }
    }, []);

    // Autocomplete API query
    const { data: suggestions, isLoading } = useQuery({
        queryKey: ['autocomplete', debouncedQuery],
        queryFn: async () => {
            if (debouncedQuery.length < 3) return [];
            try {
                const res = await api.get(`/search/autocomplete?q=${encodeURIComponent(debouncedQuery)}`);
                return res.data.data || [];
            } catch (error) {
                console.error('Autocomplete error:', error);
                return [];
            }
        },
        enabled: debouncedQuery.length >= 3,
        staleTime: 5 * 60 * 1000,
    });

    const saveRecent = (term: string) => {
        if (!term.trim()) return;
        const newRecents = [term, ...recents.filter(r => r !== term)].slice(0, MAX_RECENT);
        setRecents(newRecents);
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(newRecents));
    };

    const clearRecents = (e: React.MouseEvent) => {
        e.stopPropagation();
        setRecents([]);
        localStorage.removeItem(RECENT_SEARCHES_KEY);
    };

    const runSearch = (term: string) => {
        if (!term.trim()) return;
        saveRecent(term);
        onOpenChange(false);
        navigate(`/browse?q=${encodeURIComponent(term)}`);
        setQuery('');
    };

    // Smart Footer Logic
    const getFooterHint = () => {
        if (query.trim().length > 0) return `Press Enter to search for "${query}"`;
        return "Use arrow keys to navigate";
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* SEMANTIC THEME UPDATE: bg-background, text-foreground, border-border */}
            <DialogContent className="p-0 overflow-hidden bg-transparent border-none shadow-2xl max-w-2xl text-foreground">
                <div className="relative rounded-xl overflow-hidden border border-border/50 bg-background/80 backdrop-blur-2xl ring-1 ring-primary/10 shadow-2xl">

                    <Command className="bg-transparent">
                        {/* LIQUID LENS INPUT (Semantic) */}
                        <div className="relative flex items-center border-b border-border/40 px-4 bg-muted/20 transition-colors focus-within:bg-muted/40 font-medium">
                            {isLoading ? (
                                <Loader2 className="mr-3 h-5 w-5 text-primary animate-spin" />
                            ) : (
                                <Search className={cn("mr-3 h-5 w-5 text-muted-foreground", query && "text-primary")} />
                            )}
                            <CommandPrimitive.Input
                                placeholder="Search notes, subjects, universities..."
                                value={query}
                                onValueChange={setQuery}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        runSearch(query);
                                    }
                                }}
                                className="flex h-14 w-full rounded-md bg-transparent py-3 text-lg outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 text-foreground selection:bg-primary/20"
                            />
                            {query && (
                                <kbd className="pointer-events-none hidden h-6 select-none items-center gap-1 rounded bg-muted-foreground/10 px-2 font-mono text-xs font-medium text-muted-foreground opacity-100 sm:flex">
                                    ENTER
                                </kbd>
                            )}
                        </div>

                        <CommandList className={cn("max-h-[500px]", !query && recents.length === 0 && "py-4")}>
                            <CommandEmpty className="py-12 text-center">
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-3 rounded-full bg-primary/5 ring-1 ring-primary/20">
                                        <Sparkles className="h-6 w-6 text-primary/50" />
                                    </div>
                                    <p className="text-muted-foreground">
                                        {query.length > 0 && query.length < 3
                                            ? 'Type at least 3 characters to search...'
                                            : 'Start typing to search notes, subjects, or universities...'
                                        }
                                    </p>
                                </div>
                            </CommandEmpty>

                            {/* API AUTOCOMPLETE SUGGESTIONS */}
                            {suggestions && suggestions.length > 0 && query.length >= 3 && (
                                <CommandGroup heading={
                                    <span className="text-muted-foreground/90 text-xs font-semibold tracking-wider uppercase">
                                        Suggestions {isLoading && '(Loading...)'}
                                    </span>
                                }>
                                    {suggestions.map((item: any, index: number) => (
                                        <CommandItem
                                            key={`${item.title}-${index}`}
                                            onSelect={() => runSearch(item.title)}
                                            className="group cursor-pointer aria-selected:bg-primary/5"
                                        >
                                            <Search className="mr-3 h-4 w-4 text-primary/60 group-hover:text-primary transition-colors" />
                                            <span className="text-foreground group-hover:text-primary transition-colors font-medium">
                                                {item.title}
                                            </span>
                                            <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* RECENT SEARCHES */}
                            {recents.length > 0 && !query && (
                                <CommandGroup heading={
                                    <div className="flex justify-between items-center w-full pr-2 py-1">
                                        <span className="text-muted-foreground/90 text-xs font-semibold tracking-wider uppercase">History</span>
                                        <button
                                            onClick={clearRecents}
                                            className="text-xs text-muted-foreground/70 hover:text-destructive flex items-center gap-1 transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" /> Clear
                                        </button>
                                    </div>
                                }>
                                    {recents.map((term) => (
                                        <CommandItem key={term} onSelect={() => runSearch(term)} className="group cursor-pointer aria-selected:bg-primary/5">
                                            <Clock className="mr-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <span className="text-foreground group-hover:text-primary transition-colors">{term}</span>
                                            <ArrowRight className="ml-auto h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-primary" />
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            {/* HOLOGRAPHIC GRID RESULTS (Semantic Colors) */}
                            <div className="grid grid-cols-2 gap-0 relative">
                                <div className="absolute inset-y-0 left-1/2 w-px bg-border/40" /> {/* Vertical Divider */}

                                <CommandGroup heading="Suggestions" className="[&_[cmdk-group-items]]:gap-1 p-2">
                                    <CommandItem onSelect={() => runSearch('Engineering')} className="cursor-pointer group aria-selected:bg-accent/10">
                                        <div className="p-1 rounded-md bg-emerald-500/10 mr-3 group-hover:bg-emerald-500/20 transition-colors">
                                            <School className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <span className="group-hover:text-foreground font-medium transition-colors">Engineering</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => runSearch('Medical')} className="cursor-pointer group aria-selected:bg-accent/10">
                                        <div className="p-1 rounded-md bg-rose-500/10 mr-3 group-hover:bg-rose-500/20 transition-colors">
                                            <School className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                        </div>
                                        <span className="group-hover:text-foreground font-medium transition-colors">Medical</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => runSearch('Management')} className="cursor-pointer group aria-selected:bg-accent/10">
                                        <div className="p-1 rounded-md bg-amber-500/10 mr-3 group-hover:bg-amber-500/20 transition-colors">
                                            <School className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <span className="group-hover:text-foreground font-medium transition-colors">Management</span>
                                    </CommandItem>
                                </CommandGroup>

                                <CommandGroup heading="System" className="[&_[cmdk-group-items]]:gap-1 p-2">
                                    <CommandItem onSelect={() => { onOpenChange(false); navigate('/browse'); }} className="cursor-pointer group aria-selected:bg-primary/5">
                                        <div className="p-1 rounded-md bg-blue-500/10 mr-3 group-hover:bg-blue-500/20 transition-colors">
                                            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span className="group-hover:text-foreground font-medium transition-colors">All Notes</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => { onOpenChange(false); navigate('/seller'); }} className="cursor-pointer group aria-selected:bg-primary/5">
                                        <div className="p-1 rounded-md bg-purple-500/10 mr-3 group-hover:bg-purple-500/20 transition-colors">
                                            <LayoutDashboard className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                        </div>
                                        <span className="group-hover:text-foreground font-medium transition-colors">Dashboard</span>
                                    </CommandItem>
                                    <CommandItem onSelect={() => { onOpenChange(false); navigate('/cart'); }} className="cursor-pointer group aria-selected:bg-primary/5">
                                        <div className="p-1 rounded-md bg-orange-500/10 mr-3 group-hover:bg-orange-500/20 transition-colors">
                                            <ShoppingCart className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                        </div>
                                        <span className="group-hover:text-foreground font-medium transition-colors">Cart</span>
                                    </CommandItem>
                                </CommandGroup>
                            </div>

                        </CommandList>

                        {/* SMART FOOTER (Semantic) */}
                        <div className="border-t border-border/40 p-2 bg-muted/30 text-xs text-muted-foreground flex justify-between gap-3 px-4 backdrop-blur-md">
                            <span className="flex items-center gap-1 font-medium">{getFooterHint()}</span>
                            <div className="flex gap-3">
                                <span className="flex items-center gap-1"><kbd className="bg-background border border-border rounded px-1.5 min-w-[20px] text-center shadow-sm">↑↓</kbd> navigate</span>
                                <span className="flex items-center gap-1"><kbd className="bg-background border border-border rounded px-1 min-w-[20px] text-center shadow-sm">esc</kbd> close</span>
                            </div>
                        </div>
                    </Command>
                </div>
            </DialogContent>
        </Dialog>
    );
};
