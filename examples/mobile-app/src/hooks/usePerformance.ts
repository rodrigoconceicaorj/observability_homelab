import { useCallback, useRef } from 'react';
import { trackPerformance, trackUserAction } from '@/services/faro';
import { UsePerformanceResult } from '@/types';

// Hook para medição de performance
export const usePerformance = (): UsePerformanceResult => {
  const measurements = useRef<Map<string, number>>(new Map());

  const startMeasurement = useCallback((name: string) => {
    const startTime = Date.now();
    measurements.current.set(name, startTime);
    
    // Track início da medição
    trackUserAction('performance_measurement_start', {
      measurement_name: name,
      start_time: startTime,
    });
  }, []);

  const endMeasurement = useCallback((name: string): number => {
    const startTime = measurements.current.get(name);
    if (!startTime) {
      console.warn(`Performance measurement '${name}' was not started`);
      return 0;
    }

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Remove da lista de medições ativas
    measurements.current.delete(name);
    
    // Track no Faro
    trackPerformance(name, duration, 'ms');
    
    // Track fim da medição
    trackUserAction('performance_measurement_end', {
      measurement_name: name,
      duration,
      end_time: endTime,
    });

    return duration;
  }, []);

  const trackMetric = useCallback((name: string, value: number, unit: string = 'ms') => {
    trackPerformance(name, value, unit);
  }, []);

  return {
    startMeasurement,
    endMeasurement,
    trackMetric,
  };
};

// Hook para medição automática de tempo de renderização de componentes
export const useRenderTime = (componentName: string) => {
  const { startMeasurement, endMeasurement } = usePerformance();
  const renderStartTime = useRef<number>(Date.now());

  const trackRenderStart = useCallback(() => {
    renderStartTime.current = Date.now();
    startMeasurement(`${componentName}_render`);
  }, [componentName, startMeasurement]);

  const trackRenderEnd = useCallback(() => {
    const duration = endMeasurement(`${componentName}_render`);
    return duration;
  }, [componentName, endMeasurement]);

  return {
    trackRenderStart,
    trackRenderEnd,
  };
};

// Hook para medição de tempo de carregamento de dados
export const useDataLoadTime = () => {
  const { startMeasurement, endMeasurement } = usePerformance();

  const trackDataLoad = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> => {
    startMeasurement(`data_load_${operationName}`);
    
    try {
      const result = await operation();
      endMeasurement(`data_load_${operationName}`);
      
      trackUserAction('data_load_success', {
        operation: operationName,
        timestamp: Date.now(),
      });
      
      return result;
    } catch (error) {
      endMeasurement(`data_load_${operationName}`);
      
      trackUserAction('data_load_error', {
        operation: operationName,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
      });
      
      throw error;
    }
  }, [startMeasurement, endMeasurement]);

  return { trackDataLoad };
};

export default usePerformance;