import {
  Bus,
  Loader2,
  Radio,
} from 'lucide-react';

import type {
  LiveTransitState,
} from '../hooks/useLiveTransit';

interface Props {
  state: LiveTransitState;
}

export function LiveTransitStatus({
  state,
}: Props) {
  if (
    state.status === 'idle'
  ) {
    return null;
  }

  return (
    <div
      className="
        absolute
        bottom-5
        left-1/2
        -translate-x-1/2
        z-[550]
        glass
        px-3
        py-2
        flex
        items-center
        gap-2
        text-xs
      "
    >
      {state.status ===
      'loading' ? (
        <Loader2
          size={14}
          className="spinner text-teal-600"
        />
      ) : (
        <Radio
          size={14}
          className="text-teal-600"
        />
      )}

      <Bus
        size={14}
        className="text-slate-500"
      />

      {state.status ===
        'ready' && (
        <>
          <span className="font-semibold text-slate-700">
            {
              state.vehicles
                .length
            }{' '}
            live buses nearby
          </span>

          <span className="text-slate-400">
            · updated{' '}
            {new Date(
              state.lastUpdatedAt,
            ).toLocaleTimeString(
              'en-MY',
              {
                hour:
                  '2-digit',
                minute:
                  '2-digit',
                second:
                  '2-digit',
              },
            )}
          </span>
        </>
      )}

      {state.status ===
        'loading' && (
        <span className="text-slate-600">
          Updating live
          vehicles…
        </span>
      )}

      {state.status === 'error' && (
  <div className="text-amber-700">
    <div className="font-semibold">
      Live vehicle information unavailable
    </div>

    <div className="text-[10px] mt-0.5 max-w-[300px]">
      {state.message}
    </div>
  </div>
)}
    </div>
  );
}