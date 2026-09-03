import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  computeFirstMileAccess,
} from '../firstMileService';

import type {
  FirstMileState,
  GeoPoint,
} from '../types';

export function useFirstMile(
  origin: GeoPoint | null,
  thresholdMinutes: number,
) {
  const [state, setState] =
    useState<FirstMileState>({
      status: 'idle',
    });

  const [
    selectedStopId,
    setSelectedStopId,
  ] = useState<string | null>(null);

  useEffect(() => {
    setSelectedStopId(null);

    if (!origin) {
      setState({ status: 'idle' });
      return;
    }

    const controller = new AbortController();

    setState({
      status: 'loading',
    });

    computeFirstMileAccess(
      origin,
      thresholdMinutes,
      controller.signal,
    )
      .then(result => {
        if (controller.signal.aborted) return;

        setState({
          status: 'ready',
          stops: result.stops,
          unroutableCandidateCount:
            result.unroutableCandidateCount,
        });
      })
      .catch(error => {
        if (controller.signal.aborted) return;

        setState({
          status: 'failed',
          message:
            error instanceof Error
              ? error.message
              : 'Could not calculate first-mile access.',
        });
      });

    return () => controller.abort();
  }, [
    origin?.lat,
    origin?.lon,
    thresholdMinutes,
  ]);

  const selectedStop = useMemo(() => {
    if (
      state.status !== 'ready' ||
      !selectedStopId
    ) {
      return null;
    }

    return (
      state.stops.find(
        result =>
          result.stop.stopId === selectedStopId,
      ) ?? null
    );
  }, [state, selectedStopId]);

  return {
    state,
    selectedStopId,
    setSelectedStopId,
    selectedStop,
  };
}