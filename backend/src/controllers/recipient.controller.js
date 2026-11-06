import * as recipientService from '../services/recipient.service.js';
import { sendSuccess } from '../utils/response.js';
import { toRecipientDto } from '../utils/serializers.js';

export async function listRecipients(req, res) {
  const recipients = await recipientService.listRecipients(req.user.id);

  sendSuccess(res, {
    message: 'Daftar penerima berhasil diambil.',
    data: { recipients: recipients.map(toRecipientDto) },
  });
}

export async function addRecipient(req, res) {
  const recipient = await recipientService.addRecipient(req.user.id, req.validated);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Penerima berhasil disimpan.',
    data: { recipient: toRecipientDto(recipient) },
  });
}

export async function removeRecipient(req, res) {
  await recipientService.removeRecipient(req.user.id, req.validated.id);

  sendSuccess(res, { message: 'Penerima berhasil dihapus.' });
}
