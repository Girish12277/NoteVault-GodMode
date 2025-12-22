import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Ticket,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Copy,
    TrendingUp,
    Calendar,
    Users,
    IndianRupee,
    Percent,
    Tag,
    Clock,
    CheckCircle,
    XCircle,
    Loader2,
    Eye,
    RefreshCw,
    Info,
    HelpCircle,
    Settings,
    Sparkles,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import AdminLayout from './AdminLayout';
import { toast } from 'sonner';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Coupon {
    id: string;
    code: string;
    description: string | null;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    min_order_value: number | null;
    max_discount_amount: number | null;
    start_date: string;
    end_date: string | null;
    usage_limit_global: number | null;
    usage_limit_per_user: number | null;
    usage_count: number;
    is_active: boolean;
    scope: 'GLOBAL' | 'CATEGORY' | 'SELLER' | 'NOTE';
    scope_ids: string[];
    created_at: string;
    updated_at: string;
    usageCount?: number;
    totalDiscountGiven?: number;
}

interface CouponFormData {
    code?: string;
    description?: string;
    type: 'PERCENTAGE' | 'FLAT';
    value: number;
    minOrderValue?: number;
    maxDiscountAmount?: number;
    startDate?: string;
    endDate?: string;
    usageLimitGlobal?: number;
    usageLimitPerUser?: number;
    scope: 'GLOBAL' | 'CATEGORY' | 'SELLER' | 'NOTE';
    scopeIds: string[];
    isActive: boolean;
}

export default function AdminCoupons() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [page, setPage] = useState(1);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Detect mobile viewport
    useState(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    });

    // Fetch coupons
    const { data: couponsData, isLoading } = useQuery({
        queryKey: ['admin-coupons', page, statusFilter, typeFilter, searchQuery],
        queryFn: async () => {
            const params: any = { page, limit: 20 };
            if (statusFilter !== 'all') params.status = statusFilter;
            if (typeFilter !== 'all') params.type = typeFilter;
            if (searchQuery) params.search = searchQuery;

            const response = await api.get('/admin/coupons', { params });
            return response.data.data;
        },
    });

    // Fetch statistics
    const { data: stats } = useQuery({
        queryKey: ['admin-coupon-stats'],
        queryFn: async () => {
            const response = await api.get('/admin/coupons', { params: { limit: 1000 } });
            const allCoupons = response.data.data.coupons;

            const activeCoupons = allCoupons.filter((c: Coupon) => c.is_active).length;
            const totalDiscount = allCoupons.reduce((sum: number, c: Coupon) => sum + (c.totalDiscountGiven || 0), 0);
            const mostUsed = allCoupons.reduce((max: Coupon | null, c: Coupon) =>
                !max || (c.usageCount || 0) > (max.usageCount || 0) ? c : max, null);

            const now = new Date();
            const expiringSoon = allCoupons.filter((c: Coupon) => {
                if (!c.end_date || !c.is_active) return false;
                const endDate = new Date(c.end_date);
                const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
                return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
            }).length;

            return {
                totalCoupons: allCoupons.length,
                activeCoupons,
                totalDiscount,
                mostUsed,
                expiringSoon
            };
        },
    });

    // Delete mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const response = await api.delete(`/admin/coupons/${id}`);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Coupon deactivated successfully');
            queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
            queryClient.invalidateQueries({ queryKey: ['admin-coupon-stats'] });
            setIsDeleteDialogOpen(false);
            setSelectedCoupon(null);
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to deactivate coupon');
        },
    });

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Coupon code copied to clipboard');
    };

    const handleEdit = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsEditDialogOpen(true);
    };

    const handleDelete = (coupon: Coupon) => {
        setSelectedCoupon(coupon);
        setIsDeleteDialogOpen(true);
    };

    const formatDiscount = (coupon: Coupon) => {
        if (coupon.type === 'PERCENTAGE') {
            const cap = coupon.max_discount_amount ? ` up to ₹${coupon.max_discount_amount}` : '';
            return `${coupon.value}% off${cap}`;
        }
        return `₹${coupon.value} off`;
    };

    const formatExpiry = (endDate: string | null) => {
        if (!endDate) return 'No expiry';
        const date = new Date(endDate);
        const now = new Date();
        if (date < now) return 'Expired';

        const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        if (daysUntil === 0) return 'Expires today';
        if (daysUntil === 1) return 'Expires tomorrow';
        if (daysUntil <= 7) return `Expires in ${daysUntil} days`;
        return date.toLocaleDateString();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setTypeFilter('all');
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all';

    return (
        <AdminLayout>
            <div className="space-y-4 md:space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Coupon Management</h1>
                        <p className="text-sm md:text-base text-gray-600 mt-1">Create and manage discount coupons</p>
                    </div>
                    <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">Create Coupon</span>
                        <span className="sm:hidden">Create</span>
                    </Button>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total Coupons</CardTitle>
                            <Ticket className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-xl md:text-2xl font-bold">{stats?.totalCoupons || 0}</div>
                            <p className="text-xs text-gray-600 mt-1">
                                {stats?.activeCoupons || 0} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Total Discount Given</CardTitle>
                            <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-xl md:text-2xl font-bold">₹{stats?.totalDiscount?.toFixed(2) || 0}</div>
                            <p className="text-xs text-gray-600 mt-1">All time</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Most Used</CardTitle>
                            <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-purple-600" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-xl md:text-2xl font-bold">{stats?.mostUsed?.code || 'N/A'}</div>
                            <p className="text-xs text-gray-600 mt-1">
                                {stats?.mostUsed?.usageCount || 0} uses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-xs md:text-sm font-medium text-gray-600">Expiring Soon</CardTitle>
                            <Clock className="w-3 h-3 md:w-4 md:h-4 text-orange-600" />
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="text-xl md:text-2xl font-bold">{stats?.expiringSoon || 0}</div>
                            <p className="text-xs text-gray-600 mt-1">Within 7 days</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search by coupon code..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={typeFilter} onValueChange={setTypeFilter}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                                    <SelectItem value="FLAT">Flat Amount</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filter Indicators */}
                        {hasActiveFilters && (
                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                                <span className="text-sm text-gray-600">Active filters:</span>
                                {searchQuery && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: {searchQuery}
                                        <button onClick={() => setSearchQuery('')} className="ml-1 hover:text-red-600">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {statusFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        Status: {statusFilter}
                                        <button onClick={() => setStatusFilter('all')} className="ml-1 hover:text-red-600">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                {typeFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        Type: {typeFilter}
                                        <button onClick={() => setTypeFilter('all')} className="ml-1 hover:text-red-600">
                                            <XCircle className="w-3 h-3" />
                                        </button>
                                    </Badge>
                                )}
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 text-xs">
                                    Clear all
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Coupons Table/Cards */}
                <Card>
                    <CardContent className="pt-4 md:pt-6 pb-4 md:pb-6">
                        {isLoading ? (
                            <div className="space-y-4">
                                {/* Skeleton Loaders */}
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
                                        <div className="h-12 w-24 bg-gray-200 rounded"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                        <div className="h-8 w-20 bg-gray-200 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        ) : couponsData?.coupons?.length === 0 ? (
                            <div className="text-center py-12">
                                <Ticket className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 mb-4">No coupons found</p>
                                <Button onClick={() => setIsCreateDialogOpen(true)} variant="outline" className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    Create First Coupon
                                </Button>
                            </div>
                        ) : isMobile ? (
                            <div className="space-y-4">
                                {/* Mobile Card View */}
                                {couponsData?.coupons?.map((coupon: Coupon) => (
                                    <motion.div
                                        key={coupon.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="border rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono font-semibold">
                                                        {coupon.code}
                                                    </code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleCopyCode(coupon.code)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <Badge variant={coupon.type === 'PERCENTAGE' ? 'default' : 'secondary'} className="text-xs">
                                                        {coupon.type === 'PERCENTAGE' ? (
                                                            <><Percent className="w-3 h-3 mr-1" /> {coupon.value}%</>
                                                        ) : (
                                                            <><IndianRupee className="w-3 h-3 mr-1" /> ₹{coupon.value}</>
                                                        )}
                                                    </Badge>
                                                    {coupon.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800 text-xs">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Discount:</span>
                                                <p className="font-medium">{formatDiscount(coupon)}</p>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Usage:</span>
                                                <p className="font-medium">{coupon.usageCount || 0} uses</p>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-500">Expiry:</span>
                                                <p className="font-medium">{formatExpiry(coupon.end_date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleEdit(coupon)}
                                                className="flex-1"
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(coupon)}
                                                className="flex-1 text-red-600 hover:text-red-700"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Code</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Discount</TableHead>
                                            <TableHead>Usage</TableHead>
                                            <TableHead>Expiry</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {couponsData?.coupons?.map((coupon: Coupon) => (
                                            <TableRow key={coupon.id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <code className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">
                                                            {coupon.code}
                                                        </code>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleCopyCode(coupon.code)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={coupon.type === 'PERCENTAGE' ? 'default' : 'secondary'}>
                                                        {coupon.type === 'PERCENTAGE' ? (
                                                            <><Percent className="w-3 h-3 mr-1" /> Percentage</>
                                                        ) : (
                                                            <><IndianRupee className="w-3 h-3 mr-1" /> Flat</>
                                                        )}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {formatDiscount(coupon)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        <div>{coupon.usageCount || 0} uses</div>
                                                        {coupon.usage_limit_global && (
                                                            <div className="text-xs text-gray-500">
                                                                / {coupon.usage_limit_global} limit
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm">
                                                        {formatExpiry(coupon.end_date)}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {coupon.is_active ? (
                                                        <Badge className="bg-green-100 text-green-800">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Active
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">
                                                            <XCircle className="w-3 h-3 mr-1" />
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(coupon)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(coupon)}
                                                            className="text-red-600 hover:text-red-700"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}

                        {/* Pagination */}
                        {couponsData?.pagination && couponsData.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-6">
                                <p className="text-sm text-gray-600">
                                    Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, couponsData.pagination.total)} of {couponsData.pagination.total} coupons
                                </p>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                    >
                                        Previous
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setPage(p => p + 1)}
                                        disabled={page >= couponsData.pagination.totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Create/Edit Dialog */}
                <CouponFormDialog
                    isOpen={isCreateDialogOpen || isEditDialogOpen}
                    onClose={() => {
                        setIsCreateDialogOpen(false);
                        setIsEditDialogOpen(false);
                        setSelectedCoupon(null);
                    }}
                    coupon={selectedCoupon}
                    onSuccess={() => {
                        queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
                        queryClient.invalidateQueries({ queryKey: ['admin-coupon-stats'] });
                    }}
                />

                {/* Delete Confirmation Dialog */}
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Deactivate Coupon</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to deactivate the coupon <code className="px-2 py-1 bg-gray-100 rounded">{selectedCoupon?.code}</code>?
                                This will prevent users from using it, but historical data will be preserved.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => selectedCoupon && deleteMutation.mutate(selectedCoupon.id)}
                                disabled={deleteMutation.isPending}
                            >
                                {deleteMutation.isPending ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deactivating...</>
                                ) : (
                                    'Deactivate'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}

// Coupon Form Dialog Component
function CouponFormDialog({
    isOpen,
    onClose,
    coupon,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    coupon: Coupon | null;
    onSuccess: () => void;
}) {
    const [formData, setFormData] = useState<CouponFormData>({
        code: '',
        description: '',
        type: 'PERCENTAGE',
        value: 10,
        minOrderValue: undefined,
        maxDiscountAmount: undefined,
        startDate: new Date().toISOString().slice(0, 16),
        endDate: '',
        usageLimitGlobal: undefined,
        usageLimitPerUser: undefined,
        scope: 'GLOBAL',
        scopeIds: [],
        isActive: true,
    });
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    // Update form when coupon changes
    useState(() => {
        if (coupon) {
            setFormData({
                code: coupon.code,
                description: coupon.description || '',
                type: coupon.type,
                value: Number(coupon.value),
                minOrderValue: coupon.min_order_value ? Number(coupon.min_order_value) : undefined,
                maxDiscountAmount: coupon.max_discount_amount ? Number(coupon.max_discount_amount) : undefined,
                startDate: new Date(coupon.start_date).toISOString().slice(0, 16),
                endDate: coupon.end_date ? new Date(coupon.end_date).toISOString().slice(0, 16) : '',
                usageLimitGlobal: coupon.usage_limit_global || undefined,
                usageLimitPerUser: coupon.usage_limit_per_user || undefined,
                scope: coupon.scope,
                scopeIds: coupon.scope_ids,
                isActive: coupon.is_active,
            });
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: CouponFormData) => {
            const response = await api.post('/admin/coupons', data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Coupon created successfully');
            onSuccess();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create coupon');
        },
    });

    const updateMutation = useMutation({
        mutationFn: async (data: Partial<CouponFormData>) => {
            const response = await api.put(`/admin/coupons/${coupon!.id}`, data);
            return response.data;
        },
        onSuccess: () => {
            toast.success('Coupon updated successfully');
            onSuccess();
            onClose();
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to update coupon');
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (coupon) {
            updateMutation.mutate(formData);
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleGenerateCode = async () => {
        try {
            const response = await api.post('/admin/coupons/generate-code', {});
            setFormData({ ...formData, code: response.data.data.code });
            toast.success('Code generated');
        } catch (error) {
            toast.error('Failed to generate code');
        }
    };

    const getPreviewText = () => {
        if (formData.type === 'PERCENTAGE') {
            const cap = formData.maxDiscountAmount ? ` up to ₹${formData.maxDiscountAmount}` : '';
            return `${formData.value}% off${cap}`;
        }
        return `₹${formData.value} off`;
    };

    // Validation helper
    const validateField = (field: string, value: any) => {
        const errors: Record<string, string> = { ...validationErrors };

        if (field === 'value') {
            if (formData.type === 'PERCENTAGE' && (value < 1 || value > 100)) {
                errors.value = 'Percentage must be between 1-100';
            } else if (formData.type === 'FLAT' && value > 10000) {
                errors.value = 'Flat discount cannot exceed ₹10,000';
            } else {
                delete errors.value;
            }
        }

        if (field === 'code' && value && value.length < 3) {
            errors.code = 'Code must be at least 3 characters';
        } else if (field === 'code') {
            delete errors.code;
        }

        setValidationErrors(errors);
    };

    // Tooltip component
    const Tooltip = ({ text, children }: { text: string; children: React.ReactNode }) => (
        <div className="group relative inline-flex items-center">
            {children}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{coupon ? 'Edit Coupon' : 'Create New Coupon'}</DialogTitle>
                    <DialogDescription>
                        {coupon ? 'Update coupon settings' : 'Create a new discount coupon for your platform'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Settings */}
                    <div className="space-y-4 border-t pt-4">
                        <div className="flex items-center gap-2 mb-4">
                            <Tag className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold">Basic Settings</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="code">Coupon Code</Label>
                                    <Tooltip text="Unique code users will enter at checkout">
                                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                    </Tooltip>
                                </div>
                                <div className="flex gap-2 mt-1">
                                    <Input
                                        id="code"
                                        value={formData.code}
                                        onChange={(e) => {
                                            const value = e.target.value.toUpperCase();
                                            setFormData({ ...formData, code: value });
                                            validateField('code', value);
                                        }}
                                        placeholder="SAVE20-ABC123"
                                        disabled={!!coupon}
                                        required={!coupon}
                                        className={cn(validationErrors.code && 'border-red-500')}
                                    />
                                    {formData.code && !validationErrors.code && (
                                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-600" />
                                    )}
                                    {!coupon && (
                                        <Tooltip text="Generate random code">
                                            <Button type="button" variant="outline" onClick={handleGenerateCode}>
                                                <RefreshCw className="w-4 h-4" />
                                            </Button>
                                        </Tooltip>
                                    )}
                                </div>
                                {validationErrors.code && (
                                    <p className="text-xs text-red-600 mt-1">{validationErrors.code}</p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="e.g., New Year Sale 2024"
                                    rows={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Discount Configuration */}
                    <div className="space-y-4 border-t pt-6 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Sparkles className="w-5 h-5 text-purple-600" />
                            <h3 className="text-lg font-semibold">Discount Configuration</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="type">Discount Type</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'PERCENTAGE' | 'FLAT') => setFormData({ ...formData, type: value })}
                                    disabled={!!coupon}
                                >
                                    <SelectTrigger id="type">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                        <SelectItem value="FLAT">Flat Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="value">
                                        {formData.type === 'PERCENTAGE' ? 'Percentage (%)' : 'Amount (₹)'}
                                    </Label>
                                    <Tooltip text={formData.type === 'PERCENTAGE' ? 'Discount percentage (1-100)' : 'Flat discount amount in rupees'}>
                                        <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                    </Tooltip>
                                </div>
                                <Input
                                    id="value"
                                    type="number"
                                    value={formData.value}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setFormData({ ...formData, value });
                                        validateField('value', value);
                                    }}
                                    min={formData.type === 'PERCENTAGE' ? 1 : 0}
                                    max={formData.type === 'PERCENTAGE' ? 100 : 10000}
                                    required
                                    className={cn(validationErrors.value && 'border-red-500')}
                                />
                                {validationErrors.value && (
                                    <p className="text-xs text-red-600 mt-1">{validationErrors.value}</p>
                                )}
                            </div>

                            {formData.type === 'PERCENTAGE' && (
                                <div>
                                    <Label htmlFor="maxDiscount">Max Discount (₹)</Label>
                                    <Input
                                        id="maxDiscount"
                                        type="number"
                                        value={formData.maxDiscountAmount || ''}
                                        onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="Optional"
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="minOrder">Min Order Value (₹)</Label>
                                <Input
                                    id="minOrder"
                                    type="number"
                                    value={formData.minOrderValue || ''}
                                    onChange={(e) => setFormData({ ...formData, minOrderValue: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        {/* Enhanced Preview */}
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                            <div className="flex items-center gap-2 mb-2">
                                <Eye className="w-4 h-4 text-blue-600" />
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Live Preview</p>
                            </div>
                            <p className="text-lg font-bold text-blue-900">{getPreviewText()}</p>
                            {formData.minOrderValue && (
                                <p className="text-xs text-blue-700 mt-1">✓ Minimum order: ₹{formData.minOrderValue}</p>
                            )}
                            {formData.usageLimitGlobal && (
                                <p className="text-xs text-blue-700 mt-1">✓ Limited to {formData.usageLimitGlobal} total uses</p>
                            )}
                            {validationErrors.value && (
                                <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                                    <XCircle className="w-3 h-3" /> {validationErrors.value}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Advanced Options Toggle */}
                    <div className="border-t pt-4">
                        <button
                            type="button"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Advanced Options
                            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>

                    {/* Validity Period - Now in Advanced */}
                    {showAdvanced && (
                        <div className="space-y-4 border-t pt-6 mt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Calendar className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-semibold">Validity Period</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="startDate">Start Date</Label>
                                        <Tooltip text="When this coupon becomes active">
                                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="startDate"
                                        type="datetime-local"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        disabled={!!coupon}
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="endDate">End Date (Optional)</Label>
                                        <Tooltip text="Leave empty for no expiry">
                                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="endDate"
                                        type="datetime-local"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited validity</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Usage Limits - Now in Advanced */}
                    {showAdvanced && (
                        <div className="space-y-4 border-t pt-6 mt-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-semibold">Usage Limits</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="globalLimit">Global Usage Limit</Label>
                                        <Tooltip text="Total times this coupon can be used across all users">
                                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="globalLimit"
                                        type="number"
                                        value={formData.usageLimitGlobal || ''}
                                        onChange={(e) => setFormData({ ...formData, usageLimitGlobal: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="Unlimited"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited uses</p>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="perUserLimit">Per User Limit</Label>
                                        <Tooltip text="Maximum times a single user can use this coupon">
                                            <Info className="w-4 h-4 text-gray-400 cursor-help" />
                                        </Tooltip>
                                    </div>
                                    <Input
                                        id="perUserLimit"
                                        type="number"
                                        value={formData.usageLimitPerUser || ''}
                                        onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value ? Number(e.target.value) : undefined })}
                                        placeholder="Unlimited"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for unlimited per-user uses</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <Label htmlFor="isActive">Active Status</Label>
                        <Switch
                            id="isActive"
                            checked={formData.isActive}
                            onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || updateMutation.isPending}
                        >
                            {(createMutation.isPending || updateMutation.isPending) ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
                            ) : coupon ? (
                                'Update Coupon'
                            ) : (
                                'Create Coupon'
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
