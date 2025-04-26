import { NumberInput, Select, SelectItem } from '@heroui/react';
import { useState } from 'react';
import { useImmer } from 'use-immer';

type WindowTypes = 'hamming' | 'hanning' | 'kaiser';

type KaiserDesignParams = {
  cutoffFreq: number;
  transitionBandwidth: number;
  minStopbandAttenuation: number;
  maxPassbandRipple: number;
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
      transitionBandwidth: 0.01,
      minStopbandAttenuation: 80,
      maxPassbandRipple: 0.01,
    });

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
