import { useCallback } from 'react';
import { trackGesture, trackUserAction } from '@/services/faro';
import { GestureEvent } from '@/types';

// Hook para rastreamento de gestos e interações
export const useGestureTracking = () => {
  const trackTap = useCallback((target: string, coordinates?: { x: number; y: number }) => {
    trackGesture('tap', target, {
      coordinates,
      timestamp: Date.now(),
    });
  }, []);

  const trackSwipe = useCallback((
    target: string,
    direction: 'up' | 'down' | 'left' | 'right',
    distance?: number
  ) => {
    trackGesture('swipe', target, {
      direction,
      distance,
      timestamp: Date.now(),
    });
  }, []);

  const trackLongPress = useCallback((target: string, duration: number) => {
    trackGesture('long_press', target, {
      duration,
      timestamp: Date.now(),
    });
  }, []);

  const trackPinch = useCallback((
    target: string,
    scale: number,
    type: 'zoom_in' | 'zoom_out'
  ) => {
    trackGesture('pinch', target, {
      scale,
      type,
      timestamp: Date.now(),
    });
  }, []);

  const trackScroll = useCallback((
    target: string,
    direction: 'vertical' | 'horizontal',
    distance: number
  ) => {
    trackUserAction('scroll', {
      target,
      direction,
      distance,
      timestamp: Date.now(),
    });
  }, []);

  const trackButtonPress = useCallback((buttonName: string, context?: Record<string, any>) => {
    trackUserAction('button_press', {
      button_name: buttonName,
      context,
      timestamp: Date.now(),
    });
  }, []);

  const trackFormInteraction = useCallback((
    action: 'focus' | 'blur' | 'input' | 'submit',
    fieldName: string,
    value?: any
  ) => {
    trackUserAction('form_interaction', {
      action,
      field_name: fieldName,
      value: typeof value === 'string' ? value : undefined,
      value_type: typeof value,
      timestamp: Date.now(),
    });
  }, []);

  const trackModalInteraction = useCallback((
    action: 'open' | 'close' | 'dismiss',
    modalName: string,
    trigger?: string
  ) => {
    trackUserAction('modal_interaction', {
      action,
      modal_name: modalName,
      trigger,
      timestamp: Date.now(),
    });
  }, []);

  const trackSearchInteraction = useCallback((
    query: string,
    resultsCount: number,
    searchTime: number
  ) => {
    trackUserAction('search', {
      query: query.substring(0, 100), // Limitar tamanho da query
      results_count: resultsCount,
      search_time: searchTime,
      timestamp: Date.now(),
    });
  }, []);

  const trackListInteraction = useCallback((
    action: 'item_select' | 'item_view' | 'scroll_end' | 'refresh',
    listName: string,
    itemId?: string,
    position?: number
  ) => {
    trackUserAction('list_interaction', {
      action,
      list_name: listName,
      item_id: itemId,
      position,
      timestamp: Date.now(),
    });
  }, []);

  const trackMediaInteraction = useCallback((
    action: 'play' | 'pause' | 'stop' | 'seek' | 'volume_change',
    mediaType: 'video' | 'audio' | 'image',
    mediaId: string,
    currentTime?: number
  ) => {
    trackUserAction('media_interaction', {
      action,
      media_type: mediaType,
      media_id: mediaId,
      current_time: currentTime,
      timestamp: Date.now(),
    });
  }, []);

  return {
    trackTap,
    trackSwipe,
    trackLongPress,
    trackPinch,
    trackScroll,
    trackButtonPress,
    trackFormInteraction,
    trackModalInteraction,
    trackSearchInteraction,
    trackListInteraction,
    trackMediaInteraction,
  };
};

export default useGestureTracking;