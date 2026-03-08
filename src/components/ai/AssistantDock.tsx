import { BotMessageSquare, LoaderCircle, SendHorizonal, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'react-toastify';
import { sendAssistantMessage } from '../../services/assistantService';
import { useAuthStore } from '../../store/authStore';

const initialMessage = {
  role: 'assistant',
  content:
    'Soy tu asistente operativo. Puedo consultar tus eventos, crear tareas nuevas, cambiar estados y eliminar registros.'
};

const toTransportMessages = (messages) =>
  messages
    .filter((message) => ['assistant', 'user'].includes(message.role))
    .map((message) => ({
      role: message.role,
      content: message.content
    }));

const MarkdownMessage = ({ content }) => (
  <div className="assistant-markdown">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ ...props }) => <a {...props} target="_blank" rel="noreferrer" />
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

const AssistantDock = ({ onDataChanged }) => {
  const session = useAuthStore((state) => state.session);
  const accessToken = session?.access_token || '';

  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([initialMessage]);
  const [lastActivity, setLastActivity] = useState([]);

  const canSend = useMemo(() => input.trim().length >= 2 && !isSending && Boolean(accessToken), [input, isSending, accessToken]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!canSend) {
      return;
    }

    const userMessage = {
      role: 'user',
      content: input.trim()
    };

    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInput('');
    setIsSending(true);

    try {
      const result = await sendAssistantMessage({
        accessToken,
        messages: toTransportMessages(nextMessages)
      });

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: result.reply || 'No he podido generar una respuesta util.'
        }
      ]);

      setLastActivity(Array.isArray(result.activity) ? result.activity.slice(0, 6) : []);

      if (result.mutatedData && typeof onDataChanged === 'function') {
        onDataChanged();
      }
    } catch (error) {
      toast.error(error.message || 'No se pudo usar el asistente');
      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: 'No he podido completar la solicitud. Intentalo de nuevo en unos segundos.'
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className={`assistant-dock ${isOpen ? 'open' : ''}`}>
      <button className="assistant-toggle" onClick={() => setIsOpen((prev) => !prev)}>
        <BotMessageSquare size={16} strokeWidth={2} />
        {isOpen ? 'Cerrar asistente' : 'Asistente IA'}
      </button>

      {isOpen && (
        <article className="assistant-panel">
          <header className="assistant-header">
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={15} strokeWidth={2} />
              <strong>Asistente operativo</strong>
            </div>
            <span className="assistant-status">Conectado</span>
          </header>

          <div className="assistant-messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`assistant-msg ${message.role}`}>
                <MarkdownMessage content={message.content} />
              </div>
            ))}
          </div>

          {lastActivity.length > 0 && (
            <div className="assistant-activity">
              <p className="assistant-activity-title">Actividad reciente</p>
              <ul>
                {lastActivity.map((item, index) => (
                  <li key={`${item.action}-${item.at}-${index}`}>
                    {item.action}
                    {item.title ? ` · ${item.title}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form className="assistant-input" onSubmit={handleSubmit}>
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ejemplo: cambia a completados mis eventos de hoy"
                disabled={isSending}
              />
            <button type="submit" className="btn btn-dark btn-sm" disabled={!canSend}>
              {isSending ? <LoaderCircle className="spin" size={14} strokeWidth={2} /> : <SendHorizonal size={14} strokeWidth={2} />}
            </button>
          </form>
        </article>
      )}
    </section>
  );
};

export default AssistantDock;
