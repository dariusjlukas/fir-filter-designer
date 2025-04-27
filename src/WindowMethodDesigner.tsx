import { NumberInput, Select, SelectItem } from '@heroui/react';
import {
  bignumber,
  BigNumber,
  divide,
  floor,
  log10,
  max,
  multiply,
  number,
  pi,
  sum,
} from 'mathjs';
import { useEffect, useState } from 'react';
import { useImmer } from 'use-immer';
import { calcKaiserWindow, sinc } from './commonMath';

type WindowTypes = 'hamming' | 'hanning' | 'kaiser';

type KaiserDesignParams = {
  cutoffFreq: number;
  transitionBandwidth: number;
  minStopbandAttenuation: number;
  maxPassbandRipple: number;
};

const calcKaiserBeta = (A: number) => {
  if (A > 50) {
    return 0.1102 * (A - 8.7);
  } else if (A >= 21) {
    return 0.5842 * (A - 21) ** 0.4 + 0.07886 * (A - 21);
  } else {
    return 0;
  }
};

const estimateKaiserTapCount = (A: number, transitionBandwidth: number) =>
  floor((A - 8) / (2.285 * 2 * pi * transitionBandwidth)) + 1;

const createKaiserLowpassFilter = (parameters: KaiserDesignParams) => {
  const A = max(
    parameters.minStopbandAttenuation,
    20 * log10(10 ** (parameters.maxPassbandRipple / 20) - 1),
  );
  const beta = calcKaiserBeta(A);
  let N = estimateKaiserTapCount(A, parameters.transitionBandwidth);
  if (N % 2 === 0) {
    N++;
  }

  const sampledSinc: BigNumber[] = [...Array(N).keys()].map((n) =>
    2 * parameters.cutoffFreq * (n - (N - 1) / 2) === 0
      ? bignumber(1)
      : sinc(bignumber(2 * parameters.cutoffFreq * (n - (N - 1) / 2))),
  );
  const kaiserWindow = calcKaiserWindow(beta, N);

  const h = sampledSinc.map(
    (sample, index) => multiply(sample, kaiserWindow[index]) as BigNumber,
  );
  const h_sum = sum(h);
  return h.map((v) => divide(v, h_sum) as BigNumber);
};

export type WindowMethodDesignerProps = {
  className: string | undefined;
  setFilterTaps: React.Dispatch<React.SetStateAction<number[]>>;
  filterDesignInProgress: boolean;
  setFilterDesignInProgress: React.Dispatch<React.SetStateAction<boolean>>;
};

export const WindowMethodDesigner = (props: WindowMethodDesignerProps) => {
  const [windowType, setWindowType] = useState<WindowTypes>('kaiser');
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
      const h = createKaiserLowpassFilter(kaiserDesignParams);
      console.log('Taps: ', number(h));
      props.setFilterTaps(number(h) as number[]);
      props.setFilterDesignInProgress(false);
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
          setWindowType(keys.currentKey as WindowTypes)
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
