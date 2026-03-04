// ─── Domaine Utilisateur ──────────────────────────────────────────────────────

export type FoodAvatar = 'PIZZA' | 'SUSHI' | 'BURGER' | 'SALADE';
export type UserTheme  = 'LIGHT' | 'DARK'  | 'NEON';

export interface User {
  id:             string;
  email:          string;
  name:           string;
  pictureUrl?:    string;
  level:          number;
  xp:             number;
  streakCount:    number;
  foodAvatarType: FoodAvatar;
  theme:          UserTheme;
  isGuest:        boolean;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  tokenType:   string;
  expiresIn:   number;
  user:        User;
}

export interface ApiError {
  code:      string;
  message:   string;
  timestamp: string;
  errors?:   { field: string; message: string }[];
}

// ─── Roulettes ────────────────────────────────────────────────────────────────

export type RouletteMode = 'EQUAL' | 'WEIGHTED' | 'RANDOM';

export interface Segment {
  id:       string;
  label:    string;
  weight:   number;
  color:    string;
  position: number;
}

export interface Roulette {
  id:             string;
  groupId?:       string;
  creatorId:      string;
  creatorName:    string;
  name:           string;
  mode:           RouletteMode;
  isSurpriseMode: boolean;
  segments:       Segment[];
  createdAt:      string;
}

export interface SpinResponse {
  spinResultId:     string;
  winningSegmentId: string;
  winningLabel:     string;
  winningColor:     string;
  serverAngle:      number;
  xpEarned:         number;
  badgeUnlocked?:   { code: string; name: string; iconUrl?: string } | null;
  spunAt:           string;
}

export interface SpinHistoryEntry {
  spinResultId:     string;
  winningSegmentId: string;
  winningLabel:     string;
  winningColor:     string;
  spunByName:       string;
  spunAt:           string;
}

// ─── Groupes ──────────────────────────────────────────────────────────────────

export type GroupRole = 'ADMIN' | 'MEMBER';

export interface Group {
  id:           string;
  name:         string;
  inviteCode:   string;
  inviteQrUrl?: string;
  createdAt:    string;
}

export interface GroupMember {
  id:       string;
  userId:   string;
  name:     string;
  picture?: string;
  role:     GroupRole;
  joinedAt: string;
}

// ─── Votes ────────────────────────────────────────────────────────────────────

export type VoteMode   = 'MAJORITY' | 'APPROVAL' | 'POINTS';
export type VoteStatus = 'PENDING'  | 'ACTIVE'   | 'CLOSED';

export interface VoteOption {
  id:        string;
  label:     string;
  segmentId?: string;
}

export interface VoteSession {
  id:             string;
  groupId:        string;
  rouletteId?:    string;
  mode:           VoteMode;
  status:         VoteStatus;
  quorumPercent:  number;
  timeoutAt?:     string;
  options:        VoteOption[];
  createdAt:      string;
}

export interface OptionResult {
  optionId:    string;
  label:       string;
  voteCount:   number;
  totalPoints: number;
  percentage:  number;
}

export interface LiveVoteUpdate {
  sessionId:            string;
  groupId:              string;
  mode:                 VoteMode;
  status:               VoteStatus;
  results:              OptionResult[];
  totalVoters:          number;
  totalEligibleVoters:  number;
  quorumPercent:        number;
  winner?: {
    winningOptionId:        string;
    winningLabel:           string;
    wasTiebroken:           boolean;
    tiebreakerServerAngle?: number;
  } | null;
  updatedAt: string;
}

export interface SpinSyncMessage {
  rouletteId:       string;
  spinResultId:     string;
  winningSegmentId: string;
  winningLabel:     string;
  winningColor:     string;
  serverAngle:      number;
  spunBy:           string;
  spunByName:       string;
  spunAt:           string;
}
