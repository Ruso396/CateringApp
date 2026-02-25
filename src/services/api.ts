/// <reference path="../../global.d.ts" />
import { apiClient, BASE_URL, ENDPOINTS } from '@/src/config/api';
import type { Dish, Event, Profile, TableRow } from '@/src/types';

/** Backend connectivity test – GET /ping. Use to verify API is reachable (e.g. from device). */
export async function ping(): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.get<{ success: boolean; message: string }>(ENDPOINTS.ping);
  return data;
}

// Profile
export async function fetchProfile(): Promise<Profile> {
  const { data } = await apiClient.get<{ success: boolean; profile: Profile }>(ENDPOINTS.profile);
  if (!data.success) throw new Error('Failed to fetch profile');
  return data.profile;
}

export async function updateProfile(payload: Partial<Profile>): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(ENDPOINTS.profile, payload);
  if (!data.success) throw new Error('Failed to update profile');
}

// Events
export async function fetchEvents(): Promise<Event[]> {
  const { data } = await apiClient.get<{ success: boolean; events: Event[] }>(ENDPOINTS.events);
  if (!data.success) throw new Error('Failed to fetch events');
  return data.events;
}

export async function fetchEvent(id: number): Promise<Event> {
  const { data } = await apiClient.get<{ success: boolean; event: Event }>(ENDPOINTS.event(id));
  if (!data.success) throw new Error('Event not found');
  if (!data.event) throw new Error('Event not found');
  return data.event;
}

export async function createEvent(payload: { title: string; date?: string | null }): Promise<Event> {
  console.log('[API CREATE] === START ===');
  console.log('[API CREATE] Input payload:', JSON.stringify(payload));
  
  // Validate payload
  if (!payload.title || !payload.title.trim()) {
    const errorMsg = 'Event title is required';
    console.error('[API CREATE] VALIDATION FAILED:', errorMsg);
    throw new Error(errorMsg);
  }
  
  const requestBody = {
    title: payload.title.trim(),
    date: payload.date || null,
  };
  
  console.log('[API CREATE] Request body to send:', JSON.stringify(requestBody));
  console.log('[API CREATE] Endpoint:', ENDPOINTS.events);
  
  try {
    const response = await apiClient.post<{ success: boolean; event: Event }>(ENDPOINTS.events, requestBody);
    
    console.log('[API CREATE] HTTP 200 Response received');
    console.log('[API CREATE] Response headers:', response.headers);
    console.log('[API CREATE] Response data:', JSON.stringify(response.data));
    
    const { data } = response;
    
    if (!data.success) {
      const errorMsg = (data as any).error || 'Failed to create event';
      console.error('[API CREATE] SERVER ERROR (success=false):', errorMsg);
      throw new Error(errorMsg);
    }
    
    if (!data.event) {
      console.error('[API CREATE] ERROR: Event object missing in response:', JSON.stringify(data));
      throw new Error('Server response did not include event data');
    }
    
    console.log('[API CREATE] ✅ SUCCESS - Event ID:', data.event.id);
    console.log('[API CREATE] === END ===');
    return data.event;
  } catch (error) {
    if (error instanceof Error) {
      console.error('[API CREATE] ❌ ERROR:', error.message);
      if ((error as any).response) {
        console.error('[API CREATE] Response status:', (error as any).response.status);
        console.error('[API CREATE] Response data:', (error as any).response.data);
      }
    } else {
      console.error('[API CREATE] ❌ UNKNOWN ERROR:', String(error));
    }
    console.log('[API CREATE] === END (WITH ERROR) ===');
    throw error;
  }
}

export async function updateEvent(id: number, payload: { title: string; date?: string | null }): Promise<Event> {
  console.log('Updating ID:', id, payload);

  if (!id || id <= 0) throw new Error('Invalid event ID');
  if (!payload.title || !payload.title.trim()) throw new Error('Event title is required');

  const body = {
    title: payload.title.trim(),
    date: payload.date || null,
    user_id: 1,
  };

  const endpoint = ENDPOINTS.event(id);
  const base = (apiClient.defaults && (apiClient.defaults.baseURL as string)) || '';
  const url = base + endpoint;

  console.log('[API UPDATE] Endpoint:', url);
  console.log('[API UPDATE] Request body to send:', JSON.stringify(body));

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }

  const data = await res.json();

  if (!data || data.success === false) {
    const err = (data && data.error) || 'Failed to update event';
    throw new Error(err);
  }

  if (!data.event) throw new Error('Server response did not include event data');

  return data.event as Event;
}

export async function moveEventToTrash(id: number): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `${ENDPOINTS.event(id)}/trash`,
    {}
  );
  if (!data.success) throw new Error('Failed to move event to trash');
}

export async function fetchTrashEvents(): Promise<Event[]> {
  const { data } = await apiClient.get<{ success: boolean; events: Event[] }>(ENDPOINTS.trash);
  if (!data.success) throw new Error('Failed to fetch trash events');
  return data.events;
}

export async function restoreEventFromTrash(id: number): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(
    `${ENDPOINTS.event(id)}/restore`,
    {}
  );
  if (!data.success) throw new Error('Failed to restore event from trash');
}

export async function permanentlyDeleteEvent(id: number): Promise<void> {
  const { data } = await apiClient.delete<{ success: boolean }>(ENDPOINTS.event(id));
  if (!data.success) throw new Error('Failed to permanently delete event');
}

export async function clearTrash(): Promise<void> {
  const { data } = await apiClient.delete<{ success: boolean }>(ENDPOINTS.trash);
  if (!data.success) throw new Error('Failed to clear trash');
}

// Grocery
export async function fetchGroceryItems(eventId: number): Promise<TableRow[]> {
  const { data } = await apiClient.get<{ success: boolean; items: TableRow[] }>(ENDPOINTS.grocery(eventId));
  if (!data.success) throw new Error('Failed to fetch grocery items');
  return data.items;
}

export async function saveGroceryItems(eventId: number, items: TableRow[]): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(ENDPOINTS.grocery(eventId), { items });
  if (!data.success) throw new Error('Failed to save grocery items');
}

// Vegetable
export async function fetchVegetableItems(eventId: number): Promise<TableRow[]> {
  const { data } = await apiClient.get<{ success: boolean; items: TableRow[] }>(ENDPOINTS.vegetable(eventId));
  if (!data.success) throw new Error('Failed to fetch vegetable items');
  return data.items;
}

export async function saveVegetableItems(eventId: number, items: TableRow[]): Promise<void> {
  const { data } = await apiClient.post<{ success: boolean }>(ENDPOINTS.vegetable(eventId), { items });
  if (!data.success) throw new Error('Failed to save vegetable items');
}

// Suggestions (Vibaram)
export type SuggestionItem = { id: number; name: string };

/** Fetch all suggestions (no query). For prefix search use fetchSuggestions(query). */
export async function getSuggestions(): Promise<SuggestionItem[]> {
  const { data } = await apiClient.get<{ success: boolean; data: SuggestionItem[] }>(ENDPOINTS.suggestions);
  if (!data.success) throw new Error('Failed to fetch suggestions');
  return Array.isArray(data.data) ? data.data : [];
}

export async function fetchSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  const { data } = await apiClient.get<{ success: boolean; data: string[] }>(ENDPOINTS.suggestions, {
    params: { query: q },
  });
  if (!data.success) throw new Error('Failed to fetch suggestions');
  return Array.isArray(data.data) ? data.data : [];
}

export async function createSuggestion(name: string): Promise<void> {
  const n = name.trim();
  if (!n) throw new Error('Name is required');
  const { data } = await apiClient.post<{ success: boolean }>(ENDPOINTS.suggestions, { name: n });
  if (!data.success) throw new Error('Failed to create suggestion');
}

export async function updateSuggestion(id: number, name: string): Promise<SuggestionItem> {
  const n = name.trim();
  if (!n) throw new Error('Name is required');
  try {
    const { data } = await apiClient.put<{ success: boolean; data: SuggestionItem }>(ENDPOINTS.suggestion(id), { name: n });
    if (!data.success) throw new Error((data as any).error || 'Failed to update suggestion');
    return data.data;
  } catch (err: any) {
    const msg = err.response?.data?.error || err.message;
    throw new Error(msg);
  }
}

export async function deleteSuggestion(id: number): Promise<void> {
  try {
    const { data } = await apiClient.delete<{ success: boolean }>(ENDPOINTS.suggestion(id));
    if (!data.success) throw new Error((data as any).error || 'Failed to delete suggestion');
  } catch (err: any) {
    const msg = err.response?.data?.error || err.message;
    throw new Error(msg);
  }
}

// Dishes
export async function fetchDishes(eventId: number): Promise<Dish[]> {
  const url = BASE_URL + ENDPOINTS.dishes(eventId);
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || data.success === false) {
    const err = (data && data.error) || 'Failed to fetch dishes';
    throw new Error(err);
  }
  return Array.isArray(data.data) ? (data.data as Dish[]) : [];
}

export async function createDish(eventId: number, dishName: string): Promise<Dish> {
  const name = dishName.trim();
  if (!name) throw new Error('Dish name is required');
  const url = BASE_URL + ENDPOINTS.dishes(eventId);
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ dish_name: name }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || data.success === false) {
    const err = (data && data.error) || 'Failed to add dish';
    throw new Error(err);
  }
  return data.data as Dish;
}

export async function updateDish(eventId: number, dishId: number, dishName: string): Promise<Dish> {
  const name = dishName.trim();
  if (!eventId || eventId <= 0) throw new Error('Invalid event ID');
  if (!dishId || dishId <= 0) throw new Error('Invalid dish ID');
  if (!name) throw new Error('Dish name is required');
  const url = BASE_URL + ENDPOINTS.dish(eventId, dishId);
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ dish_name: name }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || data.success === false) {
    const err = (data && data.error) || 'Failed to update dish';
    throw new Error(err);
  }
  return data.data as Dish;
}

export async function deleteDish(eventId: number, dishId: number): Promise<void> {
  if (!eventId || eventId <= 0) throw new Error('Invalid event ID');
  if (!dishId || dishId <= 0) throw new Error('Invalid dish ID');
  const url = BASE_URL + ENDPOINTS.dish(eventId, dishId);
  const res = await fetch(url, {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt || `HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data || data.success === false) {
    const err = (data && data.error) || 'Failed to delete dish';
    throw new Error(err);
  }
}

// Custom Design
/**
 * Fetch user's custom design image URL
 * Returns null if user hasn't uploaded a custom design yet
 */
export async function fetchCustomDesignUrl(): Promise<string | null> {
  try {
    const { data } = await apiClient.get<{ success: boolean; image_url: string | null }>(ENDPOINTS.customDesign);
    if (!data.success) {
      console.warn('[API] Custom design endpoint returned success=false');
      return null;
    }
    if (data.image_url) {
      console.log('[API] fetchCustomDesignUrl image_url:', data.image_url);
    } else {
      console.log('[API] fetchCustomDesignUrl success: No design');
    }
    return data.image_url;
  } catch (error) {
    console.warn('[API] fetchCustomDesignUrl - Endpoint may not be configured yet:', error instanceof Error ? error.message : String(error));
    // Return null gracefully - endpoint might not exist on older server versions
    return null;
  }
}

/**
 * Upload custom design image (multipart/form-data)
 * Image should be pre-cropped to 560x160px before uploading
 * 
 * @param uri - Local file URI of the image
 * @returns Image URL from server
 */
export async function uploadCustomDesign(uri: string): Promise<string> {
  const base = (apiClient.defaults && (apiClient.defaults.baseURL as string)) || '';
  const url = base + ENDPOINTS.customDesignUpload;

  // Create FormData for multipart upload
  const formData = new FormData();
  
  // Extract filename from URI
  const filename = uri.split('/').pop() || 'design.jpg';
  
  // Append file to FormData
  const uriParts = uri.split('.');
  const fileType = uriParts[uriParts.length - 1];
  const mimeType = fileType === 'png' ? 'image/png' : 'image/jpeg';
  
  formData.append('image', {
    uri,
    name: filename,
    type: mimeType,
  } as any);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        // Don't set Content-Type - let the browser set it with boundary
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to upload custom design');
    }

    if (!data.image_url) {
      throw new Error('Server did not return image URL');
    }

    console.log('[API] Custom design uploaded successfully:', data.image_url);
    return data.image_url;
  } catch (error) {
    console.error('[API] uploadCustomDesign error:', error);
    throw error;
  }
}

/**
 * Delete user's custom design (optional feature)
 */
export async function deleteCustomDesign(): Promise<void> {
  const base = (apiClient.defaults && (apiClient.defaults.baseURL as string)) || '';
  const url = base + ENDPOINTS.customDesign;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`HTTP ${response.status}: ${text}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to delete custom design');
    }

    console.log('[API] Custom design deleted successfully');
  } catch (error) {
    console.error('[API] deleteCustomDesign error:', error);
    throw error;
  }
}
