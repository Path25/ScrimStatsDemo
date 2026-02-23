
// Calendar event types with timezone support
export interface CalendarEvent {
  id: string;
  title: string;
  event_type: 'scrim' | 'official' | 'team_practice' | 'team_meeting' | 'other';
  start_time: string;
  end_time?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  timezone?: string;
  scrim_id?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  title: string;
  event_type: 'scrim' | 'official' | 'team_practice' | 'team_meeting' | 'other';
  start_time: string;
  end_time?: string;
  description?: string;
  location?: string;
  attendees?: string[];
  timezone?: string;
  scrim_id?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
}
