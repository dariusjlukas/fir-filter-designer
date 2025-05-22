import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faChartLine,
  faChartSimple,
  faList,
  faMoon,
  faSun,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
  Input,
  Link,
  Navbar,
  NavbarBrand,
  NavbarContent,
  Select,
  SelectItem,
  SharedSelection,
  Switch,
  Tab,
  Tabs,
  Textarea,
} from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { useMemo, useState } from 'react';
import { WindowMethodDesigner } from './WindowMethodDesigner';
import { ThreejsPlot } from './ThreejsPlot';
import {
  abs,
  BigNumber,
  complex,
  Complex,
  fft,
  floor,
  isComplex,
  log10,
  multiply,
  number,
} from 'mathjs';
import { fftshift, linearMap } from './commonMath';
import { Float16Array } from '@petamoriken/float16';
import { stringIsValidNumber } from './util';

export type OutputDatatype = 'float64' | 'float32' | 'float16';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'bandstop';
export type TapNumericType = 'real' | 'complex';

export const App = () => {
  const { theme, setTheme } = useTheme('dark');

  const [filterDesignInProgress, setFilterDesignInProgress] = useState(false);
  const [filterTaps, setFilterTaps] = useState<BigNumber[] | Complex[]>([]);
  const [designMethod, setDesignMethod] = useState<SharedSelection>(
    new Set([])
  );
  const [outputDatatype, setOutputDatatype] =
    useState<OutputDatatype>('float64');
  const [filterType, setFilterType] = useState<FilterType>('lowpass');
  const [tapNumericType, setTapNumericType] = useState<TapNumericType>('real');
  const [sampleRate, setSampleRate] = useState('1.0');

  const castFilterTaps = useMemo(() => {
    if (!isComplex(filterTaps[0])) {
      switch (outputDatatype) {
        case 'float64':
          return new Float64Array(number(filterTaps) as number[]);
        case 'float32':
          return new Float32Array(number(filterTaps) as number[]);
        case 'float16':
          return new Float16Array(number(filterTaps) as number[]);
      }
    } else {
      const realArray = filterTaps.map((v) => (v as Complex).re);
      const imaginaryArray = filterTaps.map((v) => (v as Complex).im);

      switch (outputDatatype) {
        case 'float64': {
          const castRealArray = new Float64Array(realArray);
          const castImaginaryArray = new Float64Array(imaginaryArray);
          const complexArray = [];
          for (let i = 0; i < castRealArray.length; i++) {
            complexArray.push(complex(castRealArray[i], castImaginaryArray[i]));
          }
          return complexArray;
        }
        case 'float32': {
          const castRealArray = new Float32Array(realArray);
          const castImaginaryArray = new Float32Array(imaginaryArray);
          const complexArray = [];
          for (let i = 0; i < castRealArray.length; i++) {
            complexArray.push(complex(castRealArray[i], castImaginaryArray[i]));
          }
          return complexArray;
        }
        case 'float16': {
          const castRealArray = new Float16Array(realArray);
          const castImaginaryArray = new Float16Array(imaginaryArray);
          const complexArray = [];
          for (let i = 0; i < castRealArray.length; i++) {
            complexArray.push(complex(castRealArray[i], castImaginaryArray[i]));
          }
          return complexArray;
        }
      }
    }
  }, [filterTaps, outputDatatype]);

  const frequencyResponse = useMemo(() => {
    const targetFFTLength = Math.min(2048, castFilterTaps.length * 16);
    const fftLengthScalar = Math.floor(targetFFTLength / castFilterTaps.length);

    return castFilterTaps.length !== 0
      ? (abs(
          fftshift(
            fft(
              Array(floor(castFilterTaps.length * (fftLengthScalar / 2)))
                .fill(0)
                .concat([...castFilterTaps])
                .concat(
                  Array(
                    floor(castFilterTaps.length * (fftLengthScalar / 2))
                  ).fill(0)
                )
            )
          )
        ).map((mag) => multiply(20, log10(mag))) as number[])
      : [];
  }, [castFilterTaps]);

  return (
    <div className='size-full flex flex-col'>
      <Navbar isBordered maxWidth='full' className='pr-4'>
        <NavbarBrand>
          <h1 className='font-bold font-mono'>FIR FILTER DESIGNER</h1>
        </NavbarBrand>
        <NavbarContent justify='end'>
          <Link
            color='foreground'
            href='https://github.com/dariusjlukas/fir-filter-designer/'
          >
            <FontAwesomeIcon size='xl' icon={faGithub} />
          </Link>
          <Switch
            endContent={<FontAwesomeIcon icon={faMoon} />}
            startContent={<FontAwesomeIcon icon={faSun} />}
            isSelected={theme === 'light'}
            onValueChange={(isSelected) =>
              isSelected ? setTheme('light') : setTheme('dark')
            }
          />
        </NavbarContent>
      </Navbar>
      <div className='h-full overflow-hidden grid grid-rows-3 grid-cols-1 md:grid-rows-1 md:grid-cols-3 md:gap-2 lg:grid-cols-4 content-stretch p-1 '>
        <Card>
          <CardHeader>
            <h1>Filter Settings</h1>
          </CardHeader>
          <CardBody>
            <Select
              size='sm'
              isDisabled={filterDesignInProgress}
              disallowEmptySelection={true}
              selectedKeys={[filterType]}
              onSelectionChange={(keys) =>
                setFilterType(keys.currentKey as FilterType)
              }
              selectionMode='single'
              label='Filter Type'
            >
              <SelectItem key='lowpass'>Low-pass</SelectItem>
              <SelectItem key='highpass'>High-pass</SelectItem>
              <SelectItem key='bandpass'>Band-pass</SelectItem>
              <SelectItem key='bandstop'>Band-stop</SelectItem>
            </Select>
            <Select
              className='mt-1.5'
              size='sm'
              isDisabled={filterDesignInProgress}
              disallowEmptySelection={true}
              selectedKeys={[tapNumericType]}
              onSelectionChange={(keys) =>
                setTapNumericType(keys.currentKey as TapNumericType)
              }
              selectionMode='single'
              label='Tap Numeric Type'
            >
              <SelectItem key='real'>Real</SelectItem>
              <SelectItem key='complex'>Complex</SelectItem>
            </Select>
            <Select
              className='mt-1.5'
              size='sm'
              isDisabled={filterDesignInProgress}
              disallowEmptySelection={true}
              selectedKeys={[outputDatatype]}
              onSelectionChange={(keys) =>
                setOutputDatatype(keys.currentKey as OutputDatatype)
              }
              selectionMode='single'
              label='Tap Datatype'
            >
              <SelectItem key='float64'>Float64</SelectItem>
              <SelectItem key='float32'>Float32</SelectItem>
              <SelectItem key='float16'>Float16</SelectItem>
            </Select>
            <Input
              className='mt-1.5'
              isInvalid={!stringIsValidNumber(sampleRate)}
              errorMessage={'Input must be valid number.'}
              isDisabled={filterDesignInProgress}
              value={sampleRate ?? null}
              onValueChange={setSampleRate}
              size='sm'
              label='Sample Rate (Hz)'
            />
            <Select
              className='mt-1.5'
              size='sm'
              isDisabled={filterDesignInProgress}
              selectedKeys={designMethod}
              onSelectionChange={setDesignMethod}
              selectionMode='single'
              label='Design Method'
            >
              <SelectItem key='kaiserWindow'>Kaiser Window</SelectItem>
            </Select>
            {(designMethod as Set<string | number>).size === 0 ? (
              <></>
            ) : designMethod.currentKey === 'kaiserWindow' ? (
              <WindowMethodDesigner
                className='mt-2'
                filterType={filterType}
                tapNumericType={tapNumericType}
                sampleRate={
                  stringIsValidNumber(sampleRate) ? Number(sampleRate) : 1
                }
                setFilterTaps={setFilterTaps}
                filterDesignInProgress={filterDesignInProgress}
                setFilterDesignInProgress={setFilterDesignInProgress}
              />
            ) : designMethod.currentKey === 'parksMcClellan' ? (
              <div className='text-center text-warning font-bold'>TODO</div>
            ) : (
              <></>
            )}
          </CardBody>
          <CardFooter className='min-h-14 md:min-h-24 flex flex-col gap-2'>
            {castFilterTaps.length !== 0 && !filterDesignInProgress ? (
              <Chip variant='faded'>
                Filter design finished! Number of taps: {castFilterTaps.length}.
              </Chip>
            ) : (
              <></>
            )}
            <Button
              isDisabled={(designMethod as Set<string | number>).size === 0}
              className='w-full'
              color='primary'
              isLoading={filterDesignInProgress}
              onPress={() => {
                setFilterDesignInProgress(true);
              }}
            >
              Design Filter
            </Button>
          </CardFooter>
        </Card>
        <Card className='col-span-2 row-span-2 lg:col-span-3 h-full m-0 p-0'>
          <CardBody className='h-full'>
            <Tabs radius='lg'>
              <Tab
                className='h-full'
                key='Frequency Response'
                title={
                  <>
                    <FontAwesomeIcon icon={faChartSimple} />{' '}
                    <span className='px-1'>Frequency Response</span>
                  </>
                }
              >
                {castFilterTaps.length === 0 ? (
                  <div className='size-full content-center text-center border-2 border-dashed rounded-lg'>
                    <div>Design a filter to view its frequency response.</div>
                  </div>
                ) : (
                  <ThreejsPlot
                    xLabel='Frequency (Normalized)'
                    yLabel='Amplitude (dB)'
                    xValues={
                      tapNumericType === 'complex'
                        ? [...Array(frequencyResponse.length).keys()].map((v) =>
                            linearMap(
                              v,
                              0,
                              frequencyResponse.length - 1,
                              -0.5,
                              0.5
                            )
                          )
                        : [
                            ...Array((frequencyResponse.length + 1) / 2).keys(),
                          ].map((v) =>
                            linearMap(
                              v,
                              0,
                              (frequencyResponse.length + 1) / 2 - 1,
                              0,
                              0.5
                            )
                          )
                    }
                    yValues={[
                      tapNumericType === 'complex'
                        ? frequencyResponse
                        : frequencyResponse.slice(
                            (frequencyResponse.length + 1) / 2
                          ),
                    ]}
                    theme={theme}
                    plotType='line'
                  />
                )}
              </Tab>
              <Tab
                className='h-full'
                key='Tap Plot'
                title={
                  <>
                    <FontAwesomeIcon icon={faChartLine} />{' '}
                    <span className='px-1'>Filter Tap Plot</span>
                  </>
                }
              >
                {castFilterTaps.length === 0 ? (
                  <div className='size-full content-center text-center border-2 border-dashed rounded-lg'>
                    <div>Design a filter to view its taps.</div>
                  </div>
                ) : !isComplex(filterTaps[0]) ? (
                  <ThreejsPlot
                    xLabel='Tap Index'
                    yLabel='Value'
                    xValues={[...Array(castFilterTaps.length).keys()]}
                    yValues={[
                      [
                        ...(castFilterTaps as
                          | Float64Array<ArrayBuffer>
                          | Float32Array<ArrayBuffer>
                          | Float16Array),
                      ],
                    ]}
                    theme={theme}
                    plotType='point'
                  />
                ) : (
                  <ThreejsPlot
                    xLabel='Tap Index'
                    yLabel='Value'
                    xValues={[...Array(castFilterTaps.length).keys()]}
                    yValues={[
                      [...(castFilterTaps as Complex[]).map((v) => v.re)],
                      [...(castFilterTaps as Complex[]).map((v) => v.im)],
                    ]}
                    theme={theme}
                    plotType='point'
                  />
                )}
              </Tab>
              <Tab
                className='h-full'
                key='Taps'
                title={
                  <>
                    <FontAwesomeIcon icon={faList} />{' '}
                    <span className='px-1'>Filter Taps</span>
                  </>
                }
              >
                <Textarea
                  maxRows={30}
                  variant='bordered'
                  isReadOnly
                  value={
                    '[' +
                    [...castFilterTaps]
                      .map((v) => `${v.toString()}`)
                      .toString() +
                    ']'
                  }
                />
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default App;
