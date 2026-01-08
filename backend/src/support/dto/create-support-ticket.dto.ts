export class CreateSupportTicketDto {
  name: string;
  email: string;
  whatsapp?: string;
  subject: string;
  message: string;
}
