export const CHATBOT_ALLOWED_EMAIL = "shondsouza11@gmail.com";

export function canUseChatbot(email: string | undefined): boolean {
  return email?.trim().toLowerCase() === CHATBOT_ALLOWED_EMAIL;
}
