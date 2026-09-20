import { Clock, Loader2, Package, PackageCheck, Truck, CheckCircle, XCircle, RefreshCwIcon } from 'lucide-react';

export const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Package },
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  processing: { label: 'Processing', color: 'bg-blue-100 text-blue-800', icon: Loader2 },
  posted: { label: 'Posted', color: 'bg-purple-100 text-purple-800', icon: PackageCheck },
  on_delivery: { label: 'On Delivery', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-gray-100 text-gray-800', icon: RefreshCwIcon },
  expired: { label: 'Expired', color: 'bg-red-100 text-red-800', icon: XCircle },
};
