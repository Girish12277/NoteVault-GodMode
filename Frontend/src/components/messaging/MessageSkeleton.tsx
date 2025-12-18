import { Skeleton } from "@/components/ui/skeleton";

export function MessageSkeleton() {
    return (
        <div className="space-y-6 p-4">
            {/* Incoming Message Skeleton */}
            <div className="flex justify-start">
                <div className="max-w-[70%] rounded-2xl rounded-bl-none px-4 py-3 bg-muted/20">
                    <Skeleton className="h-4 w-48 mb-2" />
                    <Skeleton className="h-3 w-32" />
                </div>
            </div>

            {/* Outgoing Message Skeleton */}
            <div className="flex justify-end">
                <div className="max-w-[70%] rounded-2xl rounded-br-none px-4 py-3 bg-primary/10">
                    <Skeleton className="h-4 w-64 mb-2" />
                    <Skeleton className="h-3 w-20 ml-auto" />
                </div>
            </div>

            {/* Incoming Message Skeleton */}
            <div className="flex justify-start">
                <div className="max-w-[70%] rounded-2xl rounded-bl-none px-4 py-3 bg-muted/20">
                    <Skeleton className="h-4 w-40 mb-2" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </div>
            {/* Outgoing Message Skeleton */}
            <div className="flex justify-end">
                <div className="max-w-[70%] rounded-2xl rounded-br-none px-4 py-3 bg-primary/10">
                    <Skeleton className="h-4 w-32 mb-2" />
                </div>
            </div>
        </div>
    );
}
