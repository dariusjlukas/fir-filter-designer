import { NumberInput } from '@heroui/react';
import { bignumber, BigNumber, number } from 'mathjs';
import { useEffect } from 'react';
import { useImmer } from 'use-immer';
import { FilterDesignWorkerInboundMessage } from './filterDesignWorker';
import {
  createKaiserLowpassFilter,
  KaiserDesignParams,
} from './filterDesignFunctions';

export type WindowMethodDesignerProps = {
  className: string | undefined;
  setFilterTaps: React.Dispatch<React.SetStateAction<BigNumber[]>>;
  filterDesignInProgress: boolean;
  setFilterDesignInProgress: React.Dispatch<React.SetStateAction<boolean>>;
};

export const WindowMethodDesigner = (props: WindowMethodDesignerProps) => {
  const [kaiserDesignParams, setKaiserDesignParams] =
    useImmer<KaiserDesignParams>({
      cutoffFreq: 0.25,
      transitionBandwidth: 0.05,
      minStopbandAttenuation: 60,
      maxPassbandRipple: 0.01,
      besselMaxIterations: 1000,
      besselDecimalPlaces: 14,
    });

  //Design a filter when requested
  useEffect(() => {
    if (props.filterDesignInProgress) {
      if (window.Worker) {
        const windowDesignWorker = new Worker(
          new URL('filterDesignWorker.ts', import.meta.url),
          { type: 'module' },
        );
        const filterDesignMessage: FilterDesignWorkerInboundMessage = {
          messageType: 'filter design request',
          payload: {
            designMethod: 'window',
            parameters: {
              windowParameters: kaiserDesignParams,
            },
          },
        };
        windowDesignWorker.onmessage = (m: MessageEvent<string>) => {
          const workerMessage = JSON.parse(m.data);
          console.log('Received message from worker: ', workerMessage);
          switch (workerMessage.messageType) {
            case 'filter taps': {
              const taps = workerMessage.payload.map(
                (v: { mathjs: string; value: string }) => bignumber(v.value),
              );
              console.log('Setting filter taps: ', taps);
              props.setFilterTaps(taps);
              props.setFilterDesignInProgress(false);
              windowDesignWorker.terminate();
              break;
            }
            default:
              console.error(
                'Received unknown message from filter design worker!',
              );
              break;
          }
        };
        windowDesignWorker.postMessage(filterDesignMessage);
      } else {
        console.log('Web workers not supported, running in the main thread.');
        const filterTaps = createKaiserLowpassFilter(kaiserDesignParams);
        console.log('Design Finished');
        console.log('Taps: ', number(filterTaps));
        props.setFilterTaps(filterTaps);
        props.setFilterDesignInProgress(false);
      }

      console.log('returning from useEffect');
    }
  }, [props.filterDesignInProgress]);

  return (
    <div className={props.className + ' flex flex-col gap-2'}>
      <div className='flex flex-col gap-1 p-1 border-2 border-dashed border-default/80 rounded-lg'>
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.cutoffFreq}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.cutoffFreq = value;
            })
          }
          size='sm'
          label='Cutoff Frequency'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.transitionBandwidth}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.transitionBandwidth = value;
            })
          }
          size='sm'
          label='Transition Bandwidth'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.minStopbandAttenuation}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.minStopbandAttenuation = value;
            })
          }
          size='sm'
          label='Min Stopband Attenuation'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.maxPassbandRipple}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.maxPassbandRipple = value;
            })
          }
          size='sm'
          label='Max Passband Ripple'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.besselMaxIterations}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.besselMaxIterations = value;
            })
          }
          size='sm'
          label='Max Bessel Calculation Iterations'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.besselDecimalPlaces}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.besselDecimalPlaces = value;
            })
          }
          size='sm'
          label='Desired Number of Accurate Bessel Decimal Places'
        />
      </div>
    </div>
  );
};
