import { addToast, NumberInput } from '@heroui/react';
import { bignumber, BigNumber, complex, Complex } from 'mathjs';
import { useEffect } from 'react';
import * as React from 'react';
import { useImmer } from 'use-immer';
import {
  FilterDesignWorkerInboundMessage,
  FilterDesignWorkerOutboundMessage,
} from './filterDesignWorker';
import { KaiserDesignParams } from './filterDesignFunctions';
import { FilterType, TapNumericType } from './App';

type DeserializedBigNumber = { mathjs: string; value: string };
type DeserializedComplex = { mathjs: string; re: number; im: number };

export type WindowMethodDesignerProps = {
  className: string | undefined;
  filterType: FilterType;
  tapNumericType: TapNumericType;
  setFilterTaps: React.Dispatch<React.SetStateAction<BigNumber[] | Complex[]>>;
  filterDesignInProgress: boolean;
  setFilterDesignInProgress: React.Dispatch<React.SetStateAction<boolean>>;
};

const defaultLowpassParams = {
  cutoffFreq: 0.25,
  transitionBandwidth: 0.05,
  minStopbandAttenuation: 60,
  maxPassbandRipple: 0.01,
  besselMaxIterations: 1000,
  besselDecimalPlaces: 14,
};

const defaultBandpassParams = {
  cutoffFreq: [0.15, 0.4] as [number, number],
  transitionBandwidth: 0.05,
  minStopbandAttenuation: 60,
  maxPassbandRipple: 0.01,
  besselMaxIterations: 1000,
  besselDecimalPlaces: 14,
};

export const WindowMethodDesigner = (
  props: WindowMethodDesignerProps
): React.ReactNode => {
  const [kaiserDesignParams, setKaiserDesignParams] =
    useImmer<KaiserDesignParams>(defaultLowpassParams);

  useEffect(() => {
    if (props.filterType === 'lowpass' || props.filterType === 'highpass') {
      setKaiserDesignParams(defaultLowpassParams);
    } else {
      setKaiserDesignParams(defaultBandpassParams);
    }
  }, [props.filterType, setKaiserDesignParams]);

  //Design a filter when requested
  useEffect(() => {
    if (props.filterDesignInProgress) {
      if (window.Worker) {
        const windowDesignWorker = new Worker(
          new URL('filterDesignWorker.ts', import.meta.url),
          { type: 'module' }
        );
        const filterDesignMessage: FilterDesignWorkerInboundMessage = {
          messageType: 'filter design request',
          payload: {
            designMethod: 'window',
            filterType: props.filterType,
            tapNumericType: props.tapNumericType,
            parameters: {
              windowParameters: kaiserDesignParams,
            },
          },
        };
        windowDesignWorker.onmessage = (m: MessageEvent<string>) => {
          const workerMessage = JSON.parse(m.data) as {
            messageType: FilterDesignWorkerOutboundMessage['messageType'];
            payload: DeserializedBigNumber[] | DeserializedComplex[];
          };
          switch (workerMessage.messageType) {
            case 'filter taps': {
              const taps =
                workerMessage.payload[0].mathjs === 'BigNumber'
                  ? workerMessage.payload.map((v) =>
                      bignumber((v as DeserializedBigNumber).value)
                    )
                  : workerMessage.payload.map((v) =>
                      complex(
                        (v as DeserializedComplex).re,
                        (v as DeserializedComplex).im
                      )
                    );
              props.setFilterTaps(taps);
              props.setFilterDesignInProgress(false);
              windowDesignWorker.terminate();
              addToast({
                title: `Design finished! Tap count: ${taps.length}`,
                color: 'success',
              });
              break;
            }
            default:
              console.error(
                'Received unknown message from filter design worker!'
              );
              break;
          }
        };
        windowDesignWorker.postMessage(filterDesignMessage);
      } else {
        console.error('Failed to create Web Worker!');
      }
    }
  }, [
    props.filterDesignInProgress,
    props.setFilterTaps,
    props.setFilterDesignInProgress,
    kaiserDesignParams,
    props,
  ]);

  return (
    <div className={props.className + ' flex flex-col gap-2'}>
      <div className='flex flex-col gap-1 p-1 border-2 border-dashed border-default/80 rounded-lg'>
        {props.filterType === 'lowpass' || props.filterType === 'highpass' ? (
          <NumberInput
            isWheelDisabled
            isDisabled={props.filterDesignInProgress}
            value={(kaiserDesignParams.cutoffFreq as number) ?? null}
            onValueChange={(value) =>
              setKaiserDesignParams((draft) => {
                draft.cutoffFreq = value;
              })
            }
            size='sm'
            label='Cutoff Frequency (Normalized)'
          />
        ) : (
          <>
            <NumberInput
              isWheelDisabled
              isDisabled={props.filterDesignInProgress}
              value={
                (kaiserDesignParams.cutoffFreq as [number, number])[0] ?? null
              }
              onValueChange={(value) =>
                setKaiserDesignParams((draft) => {
                  (draft.cutoffFreq as [number, number])[0] = value;
                })
              }
              size='sm'
              label='Lower Cutoff Frequency (Normalized)'
            />
            <NumberInput
              isWheelDisabled
              isDisabled={props.filterDesignInProgress}
              value={
                (kaiserDesignParams.cutoffFreq as [number, number])[1] ?? null
              }
              onValueChange={(value) =>
                setKaiserDesignParams((draft) => {
                  (draft.cutoffFreq as [number, number])[1] = value;
                })
              }
              size='sm'
              label='Upper Cutoff Frequency (Normalized)'
            />
          </>
        )}
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.transitionBandwidth ?? null}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.transitionBandwidth = value;
            })
          }
          size='sm'
          label='Transition Bandwidth (Normalized)'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.minStopbandAttenuation ?? null}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.minStopbandAttenuation = value;
            })
          }
          size='sm'
          label='Min Stopband Attenuation (dB)'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.maxPassbandRipple ?? null}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.maxPassbandRipple = value;
            })
          }
          size='sm'
          label='Max Passband Ripple (dB)'
        />
        <NumberInput
          isWheelDisabled
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParams.besselMaxIterations ?? null}
          onValueChange={(value) =>
            setKaiserDesignParams((draft) => {
              draft.besselMaxIterations = value;
            })
          }
          size='sm'
          label='Max Bessel Calculation Iterations'
        />
      </div>
    </div>
  );
};
