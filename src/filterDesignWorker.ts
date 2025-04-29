import { BigNumber } from 'mathjs';
import {
  createKaiserLowpassFilter,
  KaiserDesignParams,
} from './filterDesignFunctions';

export type FilterDesignWorkerOutboundMessage = {
  messageType: 'filter taps';
  payload: BigNumber[];
};

export type FilterDesignWorkerInboundMessage = {
  messageType: 'filter design request';
  payload: FilterDesignRequest;
};

export type FilterDesignRequest = {
  designMethod: 'window' | 'parksMcClellan';
  parameters: WindowDesignRequest | ParksMcClellanDesignRequest;
};

type WindowDesignRequest = {
  windowType: WindowType;
  windowParameters: KaiserDesignParams;
};

export type WindowType = 'hamming' | 'hanning' | 'kaiser';

type ParksMcClellanDesignRequest = {
  stopbandAttenution: number;
};

onmessage = (m: MessageEvent<FilterDesignWorkerInboundMessage>) => {
  console.log('Message received by filter design worker');
  switch (m.data.messageType) {
    case 'filter design request': {
      const filterDesignRequest = m.data.payload as FilterDesignRequest;
      if (filterDesignRequest.designMethod === 'window') {
        const windowDesignRequest =
          filterDesignRequest.parameters as WindowDesignRequest;
        if (windowDesignRequest.windowType === 'hamming') {
          console.error('Hamming window not implemented yet!');
        } else if (windowDesignRequest.windowType === 'hanning') {
          console.error('Hanning window not implemented yet!');
        } else if (windowDesignRequest.windowType === 'kaiser') {
          const filterTaps = createKaiserLowpassFilter(
            windowDesignRequest.windowParameters as KaiserDesignParams,
          );
          const responseMessage: FilterDesignWorkerOutboundMessage = {
            messageType: 'filter taps',
            payload: filterTaps,
          };
          postMessage(JSON.stringify(responseMessage));
        } else {
          console.error(
            'Unknown window type: ',
            windowDesignRequest.windowType,
          );
        }
      } else if (filterDesignRequest.designMethod === 'parksMcClellan') {
        // const ParksMcClellanDesignRequest = filterDesignRequest.parameters as ParksMcClellanDesignRequest;
        console.error('Parks-McClellan not implemented yet!');
      } else {
        console.error(
          'Unknown filter design method: ',
          filterDesignRequest.designMethod,
        );
      }
      break;
    }
    default:
      console.error('Unknown message received by filter design worker: ', m);
      break;
  }
};
