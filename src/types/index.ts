export interface SessionUser {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: string;
}

export interface EventWithDetails {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  venue?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  startDate: Date;
  endDate?: Date | null;
  doorsOpen?: Date | null;
  status: string;
  coverImage?: string | null;
  ticketUrl?: string | null;
  capacity?: number | null;
  price?: number | null;
  currency: string;
  isPublic: boolean;
  dresscode?: string | null;
  ageLimit?: string | null;
  createdById?: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count?: {
    members: number;
    tasks: number;
    messages: number;
    mediaItems: number;
  };
  members?: EventMemberWithUser[];
  djs?: EventDJ[];
  genres?: EventGenre[];
}

export interface EventMemberWithUser {
  id: string;
  eventId: string;
  userId: string;
  role: string;
  createdAt: Date;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
}

export interface EventDJ {
  id: string;
  eventId: string;
  name: string;
  bio?: string | null;
  image?: string | null;
  instagramHandle?: string | null;
  setTime?: string | null;
  setDuration?: number | null;
  genres?: string | null;
  order: number;
  featured: boolean;
  createdAt: Date;
}

export interface EventGenre {
  id: string;
  eventId: string;
  genre: string;
}

export interface Task {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  category?: string | null;
  assigneeId?: string | null;
  dueDate?: Date | null;
  completedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  } | null;
}

export interface Message {
  id: string;
  eventId: string;
  userId: string;
  content: string;
  type: string;
  createdAt: Date;
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
    role: string;
  };
}

export interface MediaItem {
  id: string;
  eventId: string;
  url: string;
  thumbnailUrl?: string | null;
  type: string;
  caption?: string | null;
  uploadedById?: string | null;
  featured: boolean;
  instagramPosted: boolean;
  instagramCaption?: string | null;
  tags?: string | null;
  createdAt: Date;
}

export interface ScheduleItem {
  id: string;
  eventId: string;
  title: string;
  description?: string | null;
  type: string;
  startTime: Date;
  endTime?: Date | null;
  assignee?: string | null;
  color?: string | null;
  completed: boolean;
  order: number;
}

export interface FlyerAsset {
  id: string;
  eventId: string;
  name: string;
  url: string;
  type: string;
  djId?: string | null;
  description?: string | null;
  createdAt: Date;
}

export interface MarketingPost {
  id: string;
  eventId: string;
  platform: string;
  content: string;
  imageUrl?: string | null;
  hashtags?: string | null;
  status: string;
  scheduledAt?: Date | null;
  postedAt?: Date | null;
  notes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
