export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_BASE  = process.env.NEXT_PUBLIC_WS_URL  || 'ws://localhost:8000';

export const PRIORITY_MAP = {
  high:   { label: 'High',   class: 'badge-red',   order: 0 },
  medium: { label: 'Medium', class: 'badge-amber',  order: 1 },
  low:    { label: 'Low',    class: 'badge-green',  order: 2 },
};

export const STATUS_MAP = {
  pending:     { label: 'Pending',     class: 'badge-gray'   },
  in_progress: { label: 'In Progress', class: 'badge-blue'   },
  completed:   { label: 'Completed',   class: 'badge-green'  },
};

export const MEETING_STATUS_MAP = {
  active: { label: 'Live',   class: 'badge-green' },
  ended:  { label: 'Ended',  class: 'badge-gray'  },
  paused: { label: 'Paused', class: 'badge-amber' },
};

export const DEMO_PARTICIPANTS = ['Alex Johnson', 'Sarah Chen', 'Mike Rodriguez', 'Emma Williams'];

export const NAV_ITEMS = [
  { href: '/',          label: 'Dashboard',  icon: 'LayoutDashboard' },
  { href: '/meeting',   label: 'Live Meeting', icon: 'Video'         },
  { href: '/history',   label: 'History',    icon: 'Clock'           },
  { href: '/analytics', label: 'Analytics',  icon: 'BarChart2'       },
];
