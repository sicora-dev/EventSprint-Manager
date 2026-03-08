const parseJsonResponse = async (response: Response) => {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    return {
      raw: rawBody
    };
  }
};

export const fetchJson = async (url: string, options: RequestInit, fallbackMessage: string) => {
  const canTryDirectLocal = typeof window !== 'undefined' && typeof url === 'string' && url.startsWith('/api');
  const localUrl = canTryDirectLocal ? `http://localhost:8787${url}` : null;

  let response;

  try {
    response = await fetch(url, options);
  } catch {
    if (localUrl) {
      try {
        response = await fetch(localUrl, options);
      } catch {
        throw new Error('Servicio no disponible. Verifica que el microservicio de API este en ejecucion.');
      }
    } else {
      throw new Error('Servicio no disponible. Verifica que el microservicio de API este en ejecucion.');
    }
  }

  if (!response.ok && localUrl && (response.status === 502 || response.status === 503 || response.status === 504)) {
    try {
      const fallbackResponse = await fetch(localUrl, options);
      if (fallbackResponse.ok) {
        return (await parseJsonResponse(fallbackResponse)) || {};
      }
      response = fallbackResponse;
    } catch {
      throw new Error('Servicio no disponible. Verifica que el microservicio de API este en ejecucion.');
    }
  }

  const payload = await parseJsonResponse(response);

  if (!response.ok) {
    const errorMessage = payload?.error || payload?.message || payload?.raw || fallbackMessage;
    throw new Error(errorMessage);
  }

  return payload || {};
};
