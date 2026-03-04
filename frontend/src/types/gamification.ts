export interface BadgeDto {
  code:        string;
  name:        string;
  description: string;
  iconUrl?:    string;
  unlocked:    boolean;
  unlockedAt?: string;
}

export interface ProfileData {
  userId:      string;
  name:        string;
  email:       string;
  pictureUrl?: string;
  level:       number;
  xp:          number;
  streakCount: number;
  badges:      BadgeDto[];
  totalSpins:  number;
  totalVotes:  number;
}
