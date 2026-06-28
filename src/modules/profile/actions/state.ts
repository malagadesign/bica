export type ProfileActionState = {
  error: string | null;
  success: string | null;
};

export const profileActionInitial: ProfileActionState = {
  error: null,
  success: null,
};
