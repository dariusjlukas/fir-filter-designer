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
  windowParameters: KaiserDesignParams;
};

type ParksMcClellanDesignRequest = {
  stopbandAttenution: number;
};

onmessage = (m: MessageEvent<FilterDesignWorkerInboundMessage>) => {
  switch (m.data.messageType) {
    case 'filter design request': {
      const filterDesignRequest = m.data.payload;
      if (filterDesignRequest.designMethod === 'window') {
        const windowDesignRequest =
          filterDesignRequest.parameters as WindowDesignRequest;
        const filterTaps = createKaiserLowpassFilter(
          windowDesignRequest.windowParameters
        );
        const responseMessage: FilterDesignWorkerOutboundMessage = {
          messageType: 'filter taps',
          payload: filterTaps,
        };
        postMessage(JSON.stringify(responseMessage));
      } else if (filterDesignRequest.designMethod === 'parksMcClellan') {
        // const ParksMcClellanDesignRequest = filterDesignRequest.parameters as ParksMcClellanDesignRequest;
        console.error('Parks-McClellan not implemented yet!');
      } else {
        console.error(
          'Unknown filter design method: ',
          filterDesignRequest.designMethod
        );
      }
      break;
    }
    default:
      console.error('Unknown message received by filter design worker: ', m);
      break;
  }
};
