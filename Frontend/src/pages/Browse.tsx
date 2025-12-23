import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Note } from '@/types';
import { Search, SlidersHorizontal, X, Grid, List, Loader2, Filter, ArrowUpDown, LayoutGrid, Check, ChevronsUpDown } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NoteCard } from '@/components/notes/NoteCard';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { degrees, semesters } from '@/data/mockData';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useDebounce } from '@/hooks/use-debounce';
import { SEOHead } from '@/components/seo/SEOHead';
import { BreadcrumbSchema } from '@/components/seo/BreadcrumbSchema';

const ITEMS_PER_PAGE = 12;

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openUni, setOpenUni] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedUniversity, setSelectedUniversity] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get('categoryId') || '');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [sortBy, setSortBy] = useState('relevance');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth(); // GOD-LEVEL PERSONALIZATION
  const [hasInitialized, setHasInitialized] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, selectedDegree, selectedSemester, selectedUniversity, selectedCategoryId, priceRange, sortBy]);

  // GOD-LEVEL LOGIC: Auto-Personalize Feeds
  useEffect(() => {
    if (user && !hasInitialized && !searchParams.toString()) {
      console.log('Applying Personalization Settings...');
      if (user.degree) setSelectedDegree(user.degree.split(' - ')[0]); // Handle "Degree - Spec" format
      if (user.semester) setSelectedSemester(user.semester.toString());
      if (user.universityId) setSelectedUniversity(user.universityId);

      setHasInitialized(true);
      toast.info('Feed personalized based on your profile');
    }
  }, [user, hasInitialized, searchParams]);
  // Sync Search Query with URL Params (from Global Header)
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Fetch notes using React Query
  const { data: notesData, isLoading, error } = useQuery({
    queryKey: ['notes', debouncedSearch, selectedDegree, selectedSemester, selectedUniversity, selectedCategoryId, priceRange, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (selectedDegree) params.append('degree', selectedDegree);
      if (selectedSemester && selectedSemester !== 'all') params.append('semester', selectedSemester);
      if (selectedUniversity && selectedUniversity !== 'all') params.append('universityId', selectedUniversity);
      if (selectedCategoryId && selectedCategoryId !== 'all') params.append('categoryId', selectedCategoryId);
      if (priceRange.min) params.append('minPrice', priceRange.min);
      if (priceRange.max) params.append('maxPrice', priceRange.max);

      // Fetch all notes for client-side filtering/pagination
      params.append('limit', '1000');

      // Map sort options to API params
      if (sortBy === 'price-low') params.append('sort', 'price_asc');
      else if (sortBy === 'price-high') params.append('sort', 'price_desc');
      else if (sortBy === 'rating') params.append('sort', 'rating');
      else if (sortBy === 'downloads') params.append('sort', 'popular');
      else if (sortBy === 'newest') params.append('sort', 'newest');

      const { data } = await api.get('/notes', { params });
      return data.data.notes as Note[];
    }
  });

  // Fetch Categories and Universities for filters
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data } = await api.get('/categories');
      return data.data;
    }
  });

  const { data: universities = [] } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data } = await api.get('/universities');
      return data.data;
    }
  });

  const allNotes = (notesData || []).filter(note => !user?.purchasedNoteIds?.includes(note.id));
  const totalPages = Math.ceil(allNotes.length / ITEMS_PER_PAGE);
  const paginatedNotes = allNotes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Handle error with useEffect to prevent toast bombardment on re-renders
  useEffect(() => {
    if (error) {
      toast.error("Failed to load notes", { id: 'browse-error' });
    }
  }, [error]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDegree('');
    setSelectedSemester('');
    setSelectedUniversity('');
    setSelectedCategoryId('');
    setPriceRange({ min: '', max: '' });
    setSortBy('relevance');
    setSearchParams({});
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedDegree || selectedSemester || selectedUniversity || selectedCategoryId || priceRange.min || priceRange.max;

  // Sidebar Component - PURE FILTERING
  const FilterContent = () => (
    <div className="space-y-4 h-full flex flex-col">
      <Accordion type="multiple" defaultValue={['academic', 'category', 'price']} className="w-full flex-1 overflow-y-auto pr-1">
        {/* Academic Info */}
        <AccordionItem value="academic">
          <AccordionTrigger className="text-xs font-semibold hover:no-underline">Academic Info</AccordionTrigger>
          <AccordionContent className="space-y-3 pt-1 px-1">
            {/* University Combobox */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">University</Label>
              <Popover open={openUni} onOpenChange={setOpenUni}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openUni}
                    className="w-full justify-between h-9 text-xs font-normal"
                  >
                    <span className="truncate">
                      {selectedUniversity
                        ? universities.find((u: any) => u.id === selectedUniversity)?.name
                        : "Select University..."}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput placeholder="Search university..." />
                    <CommandList>
                      <CommandEmpty>No university found.</CommandEmpty>
                      <CommandGroup>
                        <CommandItem
                          value="all"
                          onSelect={() => {
                            setSelectedUniversity("");
                            setOpenUni(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedUniversity === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          All Universities
                        </CommandItem>
                        {universities.map((uni: any) => (
                          <CommandItem
                            key={uni.id}
                            value={uni.name}
                            onSelect={() => {
                              setSelectedUniversity(uni.id === selectedUniversity ? "" : uni.id);
                              setOpenUni(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedUniversity === uni.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {uni.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Degree */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Degree</Label>
              <Select value={selectedDegree || "all"} onValueChange={(val) => setSelectedDegree(val === "all" ? "" : val)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Degrees" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Degrees</SelectItem>
                  {degrees.map((degree) => (
                    <SelectItem key={degree} value={degree}>
                      {degree}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Semester */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Semester</Label>
              <Select value={selectedSemester || "all"} onValueChange={(val) => setSelectedSemester(val === "all" ? "" : val)}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="All Semesters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Category List */}
        <AccordionItem value="category">
          <AccordionTrigger className="text-xs font-semibold hover:no-underline">Category</AccordionTrigger>
          <AccordionContent className="pt-1 px-1">
            <div className="space-y-1">
              <Button
                variant={!selectedCategoryId ? "secondary" : "ghost"}
                size="sm"
                className="w-full justify-start h-8 font-normal"
                onClick={() => setSelectedCategoryId("")}
              >
                All Categories
              </Button>
              {categories.map((cat: any) => (
                <Button
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? "secondary" : "ghost"}
                  size="sm"
                  className="w-full justify-start h-8 font-normal truncate"
                  onClick={() => setSelectedCategoryId(cat.id)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price */}
        <AccordionItem value="price">
          <AccordionTrigger className="text-xs font-semibold hover:no-underline">Price Range</AccordionTrigger>
          <AccordionContent className="pt-1 px-1">
            <div className="flex items-center gap-2">
              <div className="space-y-1 flex-1">
                <span className="text-xs text-muted-foreground">Min</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                  className="h-8"
                />
              </div>
              <span className="text-muted-foreground pt-4">-</span>
              <div className="space-y-1 flex-1">
                <span className="text-xs text-muted-foreground">Max</span>
                <Input
                  type="number"
                  placeholder="∞"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                  className="h-8"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="ghost" className="w-full shrink-0 text-muted-foreground hover:text-destructive" onClick={clearFilters} size="sm">
          Clear All Filters
        </Button>
      )}
    </div>
  );

  // Dynamic SEO based on filters
  const getPageTitle = () => {
    const parts = [];
    if (searchQuery) parts.push(searchQuery);
    if (selectedDegree) parts.push(`${selectedDegree} Notes`);
    if (selectedSemester) parts.push(`Semester ${selectedSemester}`);
    if (selectedUniversity) {
      const uni = universities.find((u: any) => u.id === selectedUniversity);
      if (uni) parts.push(uni.name);
    }
    const base = parts.length > 0 ? parts.join(' | ') : 'Browse Academic Notes';
    return `${base} - Buy Quality Study Material | NoteVault`;
  };

  const getPageDescription = () => {
    if (searchQuery) return `Search results for "${searchQuery}". Find quality academic notes from top students. Instant download, verified content.`;
    if (selectedDegree) return `Browse ${selectedDegree} notes from top students. ${allNotes.length}+ verified study materials available. Instant download, 24h refunds.`;
    return `Browse 10,000+ verified academic notes for BTech, MBA, MBBS & more. Quality study material from top students across 500+ universities. Instant download.`;
  };

  const breadcrumbItems = [
    { name: 'Home', url: 'https://frontend-blue-sigma-18.vercel.app/' },
    { name: 'Browse Notes', url: 'https://frontend-blue-sigma-18.vercel.app/browse' }
  ];

  return (
    <Layout>
      <SEOHead
        title={getPageTitle()}
        description={getPageDescription()}
        keywords="browse notes, academic notes, study material, college notes, university notes, exam preparation"
        canonical="https://frontend-blue-sigma-18.vercel.app/browse"
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <div className="container py-2 sm:py-4">

        {/* Mobile Filter Trigger - Compact */}
        <div className="lg:hidden mb-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="w-full justify-between group h-8 border-dashed hover:border-solid hover:border-primary/50 transition-all">
                <span className="flex items-center gap-2 text-muted-foreground group-hover:text-primary">
                  <Filter className="h-4 w-4" />
                  Filters & Sort
                </span>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="ml-auto rounded-sm px-1.5 h-5 flex items-center justify-center text-xs bg-primary/10 text-primary">
                    Active
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px] p-0">
              <div className="p-4 h-full overflow-y-auto">
                <div className="mb-6 flex items-center justify-between">
                  <h3 className="font-display font-semibold text-lg">Filters</h3>
                  {/* Mobile Sort Integrated inside Sheet for better UX on small screens */}
                </div>

                <div className="mb-6 space-y-2">
                  <Label className="text-xs font-semibold">Sort By</Label>
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <FilterContent />
              </div>
            </SheetContent>
          </Sheet>
        </div>



        <div className="flex gap-6 sm:gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 rounded-xl bg-card p-4 shadow-sm border border-border/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">
                  Filters
                </h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10" onClick={clearFilters}>
                    Reset
                  </Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Results Toolbar - Hidden on mobile for compact view */}
            <div className="hidden sm:flex flex-col gap-4 mb-6 sticky top-[60px] lg:static z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 py-2 lg:py-0 border-b border-border/40 lg:border-none">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

                {/* Left: Active Chips & Count */}
                <div className="flex-1">
                  <div className="flex items-baseline gap-3 mb-2">
                    <h1 className="font-display text-2xl font-bold">Notes</h1>
                    <span className="text-xs text-muted-foreground">{paginatedNotes.length} results</span>
                  </div>

                  {/* Active Filter Chips */}
                  {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2">
                      {selectedUniversity && (
                        <Badge variant="secondary" className="px-2 py-1 rounded-md text-xs font-normal gap-1 hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => setSelectedUniversity('')}>
                          {universities.find((u: any) => u.id === selectedUniversity)?.name || 'University'} <X className="h-3 w-3" />
                        </Badge>
                      )}
                      {selectedDegree && (
                        <Badge variant="secondary" className="px-2 py-1 rounded-md text-xs font-normal gap-1 hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => setSelectedDegree('')}>
                          {selectedDegree} <X className="h-3 w-3" />
                        </Badge>
                      )}
                      {selectedSemester && (
                        <Badge variant="outline" className="px-2 py-1 rounded-md text-xs font-bold gap-1 bg-zinc-100 text-zinc-900 border-zinc-200 hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => setSelectedSemester('')}>
                          Sem {selectedSemester} <X className="h-3 w-3" />
                        </Badge>
                      )}
                      {selectedCategoryId && (
                        <Badge variant="secondary" className="px-2 py-1 rounded-md text-xs font-normal gap-1 hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => setSelectedCategoryId('')}>
                          {categories.find((c: any) => c.id === selectedCategoryId)?.name || 'Category'} <X className="h-3 w-3" />
                        </Badge>
                      )}
                      {(priceRange.min || priceRange.max) && (
                        <Badge variant="secondary" className="px-2 py-1 rounded-md text-xs font-normal gap-1 hover:bg-destructive/10 hover:text-destructive cursor-pointer" onClick={() => setPriceRange({ min: '', max: '' })}>
                          ₹{priceRange.min || 0} - {priceRange.max || '∞'} <X className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-3 shrink-0">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[160px] h-9 text-xs">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="popular">Most Popular</SelectItem>
                      <SelectItem value="rating">Highest Rated</SelectItem>
                      <SelectItem value="price_low">Price: Low to High</SelectItem>
                      <SelectItem value="price_high">Price: High to Low</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex bg-muted/50 p-1 rounded-md border border-border/50">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="icon"
                      className="h-7 w-7 rounded-sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Results Grid */}
            {isLoading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-6'
                    : 'space-y-4'
                }
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="rounded-xl bg-card shadow-sm border border-border/50 overflow-hidden">
                    <Skeleton className="aspect-[3/4] w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : paginatedNotes.length > 0 ? (
              <>
                <div
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 sm:gap-4 md:gap-6'
                      : 'space-y-4'
                  }
                >
                  {paginatedNotes.map((note, index) => (
                    <div
                      key={note.id}
                      className="animate-scale-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <NoteCard
                        note={note}
                        isPurchased={user?.purchasedNoteIds?.includes(note.id)}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (currentPage > 1) setCurrentPage(p => p - 1); }}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>

                        {Array.from({ length: totalPages }).map((_, i) => {
                          const page = i + 1;
                          if (
                            page === 1 ||
                            page === totalPages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <PaginationItem key={page} className={page !== currentPage && page !== 1 && page !== totalPages ? "hidden sm:block" : ""}>
                                <PaginationLink
                                  href="#"
                                  isActive={page === currentPage}
                                  onClick={(e) => { e.preventDefault(); setCurrentPage(page); }}
                                >
                                  {page}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          } else if (
                            (page === currentPage - 2 && page > 2) ||
                            (page === currentPage + 2 && page < totalPages - 1)
                          ) {
                            return <PaginationItem key={page}><PaginationEllipsis /></PaginationItem>;
                          }
                          return null;
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={(e) => { e.preventDefault(); if (currentPage < totalPages) setCurrentPage(p => p + 1); }}
                            className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed border-border">
                <div className="text-muted-foreground max-w-md mx-auto">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <Search className="h-10 w-10 opacity-30" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-foreground">No notes found</h3>
                  <p className="mt-2 text-base leading-relaxed">We couldn't find any notes matching your specific criteria. Try broadening your search or clearing filters.</p>
                  <Button variant="outline" className="mt-8" onClick={clearFilters}>
                    Clear All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div >
    </Layout >
  );
}
