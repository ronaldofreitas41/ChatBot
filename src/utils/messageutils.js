function getMessageText(message) {
  const content = message.message;

  return (
    content?.conversation ||
    content?.extendedTextMessage?.text ||
    content?.imageMessage?.caption ||
    content?.videoMessage?.caption ||
    ""
  )
    .trim()
    .toLowerCase();
}

export {
  getMessageText,
};  