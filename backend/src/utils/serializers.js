// Prisma returns BIGINT columns as BigInt, which JSON.stringify cannot handle.
// Amounts stay far below Number.MAX_SAFE_INTEGER, so converting is safe.

export function toUserDto(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    phone: user.phone,
    createdAt: user.createdAt,
  };
}

export function toWalletDto(wallet) {
  return {
    id: wallet.id,
    balance: Number(wallet.balance),
    updatedAt: wallet.updatedAt,
  };
}

/** "081200000002" -> "0812****0002". The list is for picking a contact, not for reading full numbers. */
export function maskPhone(phone) {
  if (phone.length <= 8) return phone;
  return `${phone.slice(0, 4)}${'*'.repeat(phone.length - 8)}${phone.slice(-4)}`;
}

export function toRecipientDto(savedRecipient) {
  const { recipient } = savedRecipient;

  return {
    id: savedRecipient.id,
    alias: savedRecipient.alias,
    username: recipient.username,
    email: recipient.email,
    phoneMasked: maskPhone(recipient.phone),
    createdAt: savedRecipient.createdAt,
  };
}

export function toPaymentDto(payment) {
  return {
    orderId: payment.orderId,
    amount: Number(payment.amount),
    status: payment.status,
    paymentType: payment.paymentType,
    // Only an unpaid order still needs its payment page.
    redirectUrl: payment.status === 'PENDING' ? payment.redirectUrl : null,
    paidAt: payment.paidAt,
    createdAt: payment.createdAt,
  };
}

export function toTransactionDto(transaction) {
  const counterpartyUser = transaction.counterpartyWallet?.user;

  return {
    id: transaction.id,
    type: transaction.type,
    amount: Number(transaction.amount),
    balanceBefore: Number(transaction.balanceBefore),
    balanceAfter: Number(transaction.balanceAfter),
    referenceId: transaction.referenceId,
    description: transaction.description,
    counterparty: counterpartyUser
      ? { username: counterpartyUser.username, email: counterpartyUser.email }
      : null,
    createdAt: transaction.createdAt,
  };
}
