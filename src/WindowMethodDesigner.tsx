import { addToast, Input } from '@heroui/react';
import { bignumber, BigNumber, complex, Complex } from 'mathjs';
import { useEffect } from 'react';
import * as React from 'react';
import { useImmer } from 'use-immer';
import {
  FilterDesignWorkerInboundMessage,
  FilterDesignWorkerOutboundMessage,
} from './filterDesignWorker';
import { FilterType, TapNumericType } from './App';
import { stringIsValidNumber } from './util';
import { KaiserDesignParams } from './filterDesignFunctions';

type DeserializedBigNumber = { mathjs: string; value: string };
type DeserializedComplex = { mathjs: string; re: number; im: number };

export type WindowMethodDesignerProps = {
  className: string | undefined;
  filterType: FilterType;
  tapNumericType: TapNumericType;
  sampleRate: number;
  setFilterTaps: React.Dispatch<React.SetStateAction<BigNumber[] | Complex[]>>;
  filterDesignInProgress: boolean;
  setFilterDesignInProgress: React.Dispatch<React.SetStateAction<boolean>>;
};

const defaultLowpassParams = {
  cutoffFreq: '0.25',
  transitionBandwidth: '0.05',
  minStopbandAttenuation: '60',
  maxPassbandRipple: '0.01',
  besselMaxIterations: '1000',
};

const defaultBandpassParams = {
  cutoffFreq: ['0.15', '0.4'],
  transitionBandwidth: '0.05',
  minStopbandAttenuation: '60',
  maxPassbandRipple: '0.01',
  besselMaxIterations: '1000',
};

const validateAndParseDesignParams = (
  filterType: WindowMethodDesignerProps['filterType'],
  sampleRate: number,
  params: typeof defaultLowpassParams | typeof defaultBandpassParams
): KaiserDesignParams | null => {
  if (filterType === 'lowpass' || filterType === 'highpass') {
    // Check all values
    if (
      stringIsValidNumber(params.cutoffFreq as string) &&
      stringIsValidNumber(params.transitionBandwidth) &&
      stringIsValidNumber(params.minStopbandAttenuation) &&
      stringIsValidNumber(params.maxPassbandRipple) &&
      stringIsValidNumber(params.besselMaxIterations)
    ) {
      return {
        cutoffFreq: Number(params.cutoffFreq as string) / sampleRate,
        transitionBandwidth: Number(params.transitionBandwidth) / sampleRate,
        minStopbandAttenuation: Number(params.minStopbandAttenuation),
        maxPassbandRipple: Number(params.maxPassbandRipple),
        besselMaxIterations: Number(params.besselMaxIterations),
      };
    } else {
      return null;
    }
  } else {
    // Check all values
    if (
      stringIsValidNumber((params.cutoffFreq as [string, string])[0]) &&
      stringIsValidNumber((params.cutoffFreq as [string, string])[1]) &&
      stringIsValidNumber(params.transitionBandwidth) &&
      stringIsValidNumber(params.minStopbandAttenuation) &&
      stringIsValidNumber(params.maxPassbandRipple) &&
      stringIsValidNumber(params.besselMaxIterations)
    ) {
      return {
        cutoffFreq: [
          Number((params.cutoffFreq as [string, string])[0]) / sampleRate,
          Number((params.cutoffFreq as [string, string])[1]) / sampleRate,
        ],
        transitionBandwidth: Number(params.transitionBandwidth) / sampleRate,
        minStopbandAttenuation: Number(params.minStopbandAttenuation),
        maxPassbandRipple: Number(params.maxPassbandRipple),
        besselMaxIterations: Number(params.besselMaxIterations),
      };
    } else {
      return null;
    }
  }
};

export const WindowMethodDesigner = (
  props: WindowMethodDesignerProps
): React.ReactNode => {
  const [kaiserLowpassDesignParams, setKaiserLowpassDesignParams] =
    useImmer<typeof defaultLowpassParams>(defaultLowpassParams);
  const [kaiserBandpassDesignParams, setKaiserBandpassDesignParams] = useImmer<
    typeof defaultBandpassParams
  >(defaultBandpassParams);

  const kaiserDesignParamsWrapper =
    props.filterType === 'lowpass' || props.filterType === 'highpass'
      ? kaiserLowpassDesignParams
      : kaiserBandpassDesignParams;
  const setKaiserDesignParamsWrapper =
    props.filterType === 'lowpass' || props.filterType === 'highpass'
      ? setKaiserLowpassDesignParams
      : setKaiserBandpassDesignParams;

  //Design a filter when requested
  useEffect(() => {
    if (props.filterDesignInProgress) {
      if (
        validateAndParseDesignParams(
          props.filterType,
          props.sampleRate,
          kaiserDesignParamsWrapper
        ) !== null
      ) {
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
                windowParameters: validateAndParseDesignParams(
                  props.filterType,
                  props.sampleRate,
                  kaiserDesignParamsWrapper
                ) as KaiserDesignParams,
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
      } else {
        props.setFilterDesignInProgress(false);
      }
    }
  }, [
    props.filterDesignInProgress,
    props.setFilterTaps,
    props.setFilterDesignInProgress,
    kaiserDesignParamsWrapper,
    props,
  ]);

  return (
    <div className={props.className + ' flex flex-col gap-2'}>
      <div className='flex flex-col gap-1 p-1 border-2 border-dashed border-default/80 rounded-lg'>
        {props.filterType === 'lowpass' || props.filterType === 'highpass' ? (
          <Input
            isInvalid={
              !stringIsValidNumber(kaiserLowpassDesignParams.cutoffFreq)
            }
            errorMessage={'Input must be valid number.'}
            isDisabled={props.filterDesignInProgress}
            step={0.01}
            value={kaiserLowpassDesignParams.cutoffFreq ?? null}
            onValueChange={(value) =>
              setKaiserLowpassDesignParams((draft) => {
                draft.cutoffFreq = value;
              })
            }
            size='sm'
            label='Cutoff Frequency (Hz)'
          />
        ) : (
          <>
            <Input
              isInvalid={
                !stringIsValidNumber(kaiserLowpassDesignParams.cutoffFreq[0])
              }
              errorMessage={'Input must be valid number.'}
              isDisabled={props.filterDesignInProgress}
              step={0.01}
              value={kaiserBandpassDesignParams.cutoffFreq[0] ?? null}
              onValueChange={(value) =>
                setKaiserBandpassDesignParams((draft) => {
                  draft.cutoffFreq[0] = value;
                })
              }
              size='sm'
              label='Lower Cutoff Frequency (Hz)'
            />
            <Input
              isInvalid={
                !stringIsValidNumber(kaiserLowpassDesignParams.cutoffFreq[1])
              }
              errorMessage={'Input must be valid number.'}
              isDisabled={props.filterDesignInProgress}
              step={0.01}
              value={kaiserBandpassDesignParams.cutoffFreq[1] ?? null}
              onValueChange={(value) =>
                setKaiserBandpassDesignParams((draft) => {
                  draft.cutoffFreq[1] = value;
                })
              }
              size='sm'
              label='Upper Cutoff Frequency (Hz)'
            />
          </>
        )}
        <Input
          isInvalid={
            !stringIsValidNumber(kaiserDesignParamsWrapper.transitionBandwidth)
          }
          errorMessage={'Input must be valid number.'}
          isDisabled={props.filterDesignInProgress}
          step={0.01}
          value={kaiserDesignParamsWrapper.transitionBandwidth ?? null}
          onValueChange={(value) =>
            setKaiserDesignParamsWrapper(
              (draft: { transitionBandwidth: string }) => {
                draft.transitionBandwidth = value;
              }
            )
          }
          size='sm'
          label='Transition Bandwidth (Hz)'
        />
        <Input
          isInvalid={
            !stringIsValidNumber(
              kaiserDesignParamsWrapper.minStopbandAttenuation
            )
          }
          errorMessage={'Input must be valid number.'}
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParamsWrapper.minStopbandAttenuation ?? null}
          onValueChange={(value) =>
            setKaiserDesignParamsWrapper(
              (draft: { minStopbandAttenuation: string }) => {
                draft.minStopbandAttenuation = value;
              }
            )
          }
          size='sm'
          label='Min Stopband Attenuation (dB)'
        />
        <Input
          isInvalid={
            !stringIsValidNumber(kaiserDesignParamsWrapper.maxPassbandRipple)
          }
          errorMessage={'Input must be valid number.'}
          isDisabled={props.filterDesignInProgress}
          step={0.01}
          value={kaiserDesignParamsWrapper.maxPassbandRipple ?? null}
          onValueChange={(value) =>
            setKaiserDesignParamsWrapper(
              (draft: { maxPassbandRipple: string }) => {
                draft.maxPassbandRipple = value;
              }
            )
          }
          size='sm'
          label='Max Passband Ripple (dB)'
        />
        <Input
          isInvalid={
            !stringIsValidNumber(kaiserDesignParamsWrapper.besselMaxIterations)
          }
          errorMessage={'Input must be valid number.'}
          isDisabled={props.filterDesignInProgress}
          value={kaiserDesignParamsWrapper.besselMaxIterations ?? null}
          onValueChange={(value) =>
            setKaiserDesignParamsWrapper(
              (draft: { besselMaxIterations: string }) => {
                draft.besselMaxIterations = value;
              }
            )
          }
          size='sm'
          label='Max Bessel Calculation Iterations'
        />
      </div>
    </div>
  );
};
