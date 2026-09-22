/**
 * Email Notification Service (Disabled)
 * Email notifications have been removed as requested.
 */
class EmailService {
  constructor() {
    this.isConfigured = false;
  }

  async sendMail() {
    return false;
  }

  async sendMentionEmail() {
    return false;
  }

  async sendCommentReplyEmail() {
    return false;
  }

  async sendProjectStatusUpdateEmail() {
    return false;
  }

  async sendProjectAssignmentEmail() {
    return false;
  }

  async sendDeadlineAlertEmail() {
    return false;
  }

  async sendSubadminWelcomeEmail() {
    return false;
  }

  async sendTestEmail() {
    return { success: false, message: "Email notifications are disabled" };
  }

  async verifyConnection() {
    return { configured: false, ok: false, message: "Email notifications are disabled" };
  }
}

export const emailService = new EmailService();
export default emailService;
