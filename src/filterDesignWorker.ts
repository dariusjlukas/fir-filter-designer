import { type BigNumber, type Complex } from 'mathjs';
import {
  createKaiserFilter,
  KaiserDesignParams,
} from './filterDesignFunctions';
import { FilterType, TapNumericType } from './App';

export type FilterDesignWorkerOutboundMessage = {
  messageType: 'filter taps';
  payload: BigNumber[] | Complex[];
};

export type FilterDesignWorkerInboundMessage = {
  messageType: 'filter design request';
  payload: FilterDesignRequest;
};

export type FilterDesignRequest = {
  designMethod: 'window' | 'parksMcClellan';
  filterType: FilterType;
  tapNumericType: TapNumericType;
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
        const filterTaps = createKaiserFilter(
          filterDesignRequest.filterType,
          filterDesignRequest.tapNumericType,
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
