import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Json } from '@/integrations/supabase/types';

// Generate a unique session ID that persists for the browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

export type EventCategory = 'navigation' | 'interaction' | 'conversion' | 'engagement' | 'error' | 'general';

interface TrackEventOptions {
  eventName: string;
  category?: EventCategory;
  metadata?: Record<string, Json>;
}

export function useAnalytics() {
  const { user } = useAuth();
  const sessionId = useRef(getSessionId());
  const lastPageView = useRef<string | null>(null);

  // Track page view on mount and route changes
  const trackPageView = useCallback((pagePath?: string) => {
    const path = pagePath || window.location.pathname;
    
    // Avoid duplicate page views for the same path
    if (lastPageView.current === path) return;
    lastPageView.current = path;

    const eventData = {
      event_name: 'page_view',
      event_category: 'navigation',
      user_id: user?.id || null,
      session_id: sessionId.current,
      page_url: window.location.href,
      page_path: path,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      metadata: {
        title: document.title,
        screen_width: window.innerWidth,
        screen_height: window.innerHeight,
      },
    };

    supabase.from('analytics_events').insert([eventData]).then(({ error }) => {
      if (error) console.error('Analytics error:', error);
    });
  }, [user?.id]);

  // Track custom events
  const trackEvent = useCallback(({ eventName, category = 'general', metadata = {} }: TrackEventOptions) => {
    const eventData = {
      event_name: eventName,
      event_category: category,
      user_id: user?.id || null,
      session_id: sessionId.current,
      page_url: window.location.href,
      page_path: window.location.pathname,
      referrer: document.referrer || null,
      user_agent: navigator.userAgent,
      metadata,
    };

    supabase.from('analytics_events').insert([eventData]).then(({ error }) => {
      if (error) console.error('Analytics error:', error);
    });
  }, [user?.id]);

  // Convenience methods for common events
  const trackClick = useCallback((elementName: string, metadata?: Record<string, Json>) => {
    trackEvent({ 
      eventName: 'click', 
      category: 'interaction', 
      metadata: { element: elementName, ...metadata } 
    });
  }, [trackEvent]);

  const trackSignup = useCallback((method: string, metadata?: Record<string, Json>) => {
    trackEvent({ 
      eventName: 'signup', 
      category: 'conversion', 
      metadata: { method, ...metadata } 
    });
  }, [trackEvent]);

  const trackLogin = useCallback((method: string, metadata?: Record<string, Json>) => {
    trackEvent({ 
      eventName: 'login', 
      category: 'conversion', 
      metadata: { method, ...metadata } 
    });
  }, [trackEvent]);

  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, Json>) => {
    trackEvent({ 
      eventName: 'form_submit', 
      category: 'interaction', 
      metadata: { form: formName, ...metadata } 
    });
  }, [trackEvent]);

  const trackSearch = useCallback((query: string, metadata?: Record<string, Json>) => {
    trackEvent({ 
      eventName: 'search', 
      category: 'engagement', 
      metadata: { query, ...metadata } 
    });
  }, [trackEvent]);

  return {
    trackPageView,
    trackEvent,
    trackClick,
    trackSignup,
    trackLogin,
    trackFormSubmit,
    trackSearch,
  };
}

// Auto-tracking component to use at app root
export function useAutoPageTracking() {
  const { trackPageView } = useAnalytics();
  
  useEffect(() => {
    trackPageView();
  }, [trackPageView]);
}
