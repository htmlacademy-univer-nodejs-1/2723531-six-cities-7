export const USER_TYPES = ['regular', 'pro'] as const;

export type UserType = typeof USER_TYPES[number];
