const allowedRoles = new Set(['system', 'user', 'assistant']);

const normalizeContent = (content) => {
  if (typeof content === 'string') {
    return content.trim().slice(0, 6000);
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }

        if (item?.type === 'text' && typeof item?.text === 'string') {
          return item.text;
        }

        return '';
      })
      .join('\n')
      .trim()
      .slice(0, 6000);
  }

  return '';
};

export const sanitizeChatMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => allowedRoles.has(message?.role))
    .map((message) => ({
      role: message.role,
      content: normalizeContent(message.content)
    }))
    .filter((message) => message.content.length > 0)
    .slice(-18);
};
