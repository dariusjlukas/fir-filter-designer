import { NumberInput, Select, SelectItem } from '@heroui/react';
import { bignumber, BigNumber, number } from 'mathjs';
import { useEffect, useState } from 'react';
import { useImmer } from 'use-immer';
import {
  FilterDesignWorkerInboundMessage,
  WindowType,
} from './filterDesignWorker';
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
  const [windowType, setWindowType] = useState<WindowType>('kaiser');
  const [kaiserDesignParams, setKaiserDesignParams] =
    useImmer<KaiserDesignParams>({
      cutoffFreq: 0.25,
      transitionBandwidth: 0.05,
      minStopbandAttenuation: 60,
      maxPassbandRipple: 0.01,
    });

  //Design a filter when requested
  useEffect(() => {
    if (props.filterDesignInProgress) {
      console.log('Designing a filter with a: ', windowType, ' window');
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
              windowType: 'kaiser',
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
      <Select
        isDisabled={props.filterDesignInProgress}
        label='Window Type'
        disallowEmptySelection
        selectedKeys={new Set([windowType])}
        onSelectionChange={(keys) =>
          setWindowType(keys.currentKey as WindowType)
        }
      >
        <SelectItem key='kaiser'>Kaiser</SelectItem>
        <SelectItem key='hamming'>Hamming</SelectItem>
        <SelectItem key='hanning'>Hanning</SelectItem>
      </Select>
      {windowType === 'kaiser' ? (
        <div className='flex flex-col gap-1 p-1 border-2 border-dashed border-default/80 rounded-lg'>
          <NumberInput
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
        </div>
      ) : (
        <></>
      )}
    </div>
  );
};
