import { tool } from '@openrouter/sdk';
import { z } from 'zod';
import {
  createScopedEvent,
  deleteScopedEvent,
  findScopedEventByTitle,
  listScopedEvents,
  updateScopedEvent
} from './supabaseUserClient';

const statusSchema = z.enum(['planned', 'in_progress', 'done']);
const prioritySchema = z.enum(['low', 'medium', 'high']);

type ActivityEntry = {
  at?: string;
  type: 'query' | 'mutation';
  action: string;
  count?: number;
  eventId?: string;
  title?: string;
};

interface AssistantToolsContext {
  client: any;
  userId: string;
  activityLog: ActivityEntry[];
  mutationState: { hasMutations: boolean };
}

const compactEvent = (event: any) => ({
  id: event.id,
  title: event.title,
  location: event.location,
  eventDate: event.event_date,
  status: event.status,
  priority: event.priority
});

const logActivity = (activityLog: ActivityEntry[], entry: Omit<ActivityEntry, 'at'>) => {
  activityLog.push({
    at: new Date().toISOString(),
    ...entry
  });
};

const resolveEventId = async (
  client: any,
  { eventId, titleContains }: { eventId?: string; titleContains?: string }
) => {
  if (eventId) {
    return eventId;
  }

  const event = await findScopedEventByTitle(client, titleContains);
  return event.id;
};

export const createAssistantTools = ({ client, userId, activityLog, mutationState }: AssistantToolsContext) => {
  const tools = [
    tool({
      name: 'list_events',
      description: 'Obtiene eventos del usuario con filtros opcionales.',
      inputSchema: z.object({
        status: statusSchema.optional(),
        fromDate: z.string().datetime().optional(),
        toDate: z.string().datetime().optional(),
        limit: z.number().int().min(1).max(40).optional()
      }),
      execute: async ({ status, fromDate, toDate, limit }) => {
        const events = await listScopedEvents(client, { status, fromDate, toDate, limit: limit || 20 });

        logActivity(activityLog, {
          type: 'query',
          action: 'list_events',
          count: events.length
        });

        return {
          total: events.length,
          events: events.map(compactEvent)
        };
      }
    }),

    tool({
      name: 'create_event',
      description: 'Crea un nuevo evento del usuario actual.',
      inputSchema: z.object({
        title: z.string().min(3),
        description: z.string().min(6),
        location: z.string().min(2),
        eventDate: z.string().datetime(),
        priority: prioritySchema.optional(),
        status: statusSchema.optional()
      }),
      execute: async ({ title, description, location, eventDate, priority, status }) => {
        const created = await createScopedEvent(client, {
          owner_id: userId,
          title,
          description,
          location,
          event_date: eventDate,
          priority: priority || 'medium',
          status: status || 'planned'
        });

        mutationState.hasMutations = true;

        logActivity(activityLog, {
          type: 'mutation',
          action: 'create_event',
          eventId: created.id,
          title: created.title
        });

        return {
          message: 'Evento creado',
          event: compactEvent(created)
        };
      }
    }),

    tool({
      name: 'update_event',
      description: 'Actualiza un evento existente del usuario.',
      inputSchema: z.object({
        eventId: z.string().uuid().optional(),
        titleContains: z.string().min(2).optional(),
        title: z.string().min(3).optional(),
        description: z.string().min(6).optional(),
        location: z.string().min(2).optional(),
        eventDate: z.string().datetime().optional(),
        priority: prioritySchema.optional(),
        status: statusSchema.optional()
      }),
      execute: async ({ eventId, titleContains, title, description, location, eventDate, priority, status }) => {
        const resolvedId = await resolveEventId(client, { eventId, titleContains });

        const updated = await updateScopedEvent(client, resolvedId, {
          ...(title ? { title } : {}),
          ...(description ? { description } : {}),
          ...(location ? { location } : {}),
          ...(eventDate ? { event_date: eventDate } : {}),
          ...(priority ? { priority } : {}),
          ...(status ? { status } : {})
        });

        mutationState.hasMutations = true;

        logActivity(activityLog, {
          type: 'mutation',
          action: 'update_event',
          eventId: updated.id,
          title: updated.title
        });

        return {
          message: 'Evento actualizado',
          event: compactEvent(updated)
        };
      }
    }),

    tool({
      name: 'delete_event',
      description: 'Elimina un evento del usuario.',
      inputSchema: z.object({
        eventId: z.string().uuid().optional(),
        titleContains: z.string().min(2).optional()
      }),
      execute: async ({ eventId, titleContains }) => {
        const resolvedId = await resolveEventId(client, { eventId, titleContains });
        await deleteScopedEvent(client, resolvedId);

        mutationState.hasMutations = true;

        logActivity(activityLog, {
          type: 'mutation',
          action: 'delete_event',
          eventId: resolvedId
        });

        return {
          message: 'Evento eliminado',
          eventId: resolvedId
        };
      }
    })
  ];

  return tools;
};
