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
  addToast,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Chip,
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
import { useEffect, useMemo, useState } from 'react';
import { WindowMethodDesigner } from './WindowMethodDesigner';
import { ThreejsPlot } from './ThreejsPlot';
import { abs, BigNumber, fft, floor, log10, multiply, number } from 'mathjs';
import { fftshift } from './commonMath';

export type OutputDatatype = 'float64';

export const App = () => {
  const { theme, setTheme } = useTheme('dark');

  const [filterDesignInProgress, setFilterDesignInProgress] = useState(false);
  const [filterTaps, setFilterTaps] = useState<BigNumber[]>([]);
  const [designMethod, setDesignMethod] = useState<SharedSelection>(
    new Set([]),
  );
  const [outputDatatype, setOutputDatatype] =
    useState<OutputDatatype>('float64');

  const fftLengthScalar = 8;

  const frequencyResponse = useMemo(
    () =>
      filterTaps.length !== 0
        ? (abs(
            fftshift(
              fft(
                Array(floor(filterTaps.length * (fftLengthScalar / 2)))
                  .fill(0)
                  .concat(number(filterTaps))
                  .concat(
                    Array(
                      floor(filterTaps.length * (fftLengthScalar / 2)),
                    ).fill(0),
                  ),
              ),
            ),
          ).map((mag) => multiply(20, log10(mag))) as number[])
        : [],
    [filterTaps, fftLengthScalar],
  );

  useEffect(() => {
    if (!filterDesignInProgress && filterTaps.length !== 0) {
      addToast({
        title: `Design finished! Tap count: ${filterTaps.length}`,
        color: 'success',
      });
      console.log('frequencyResponse: ', frequencyResponse);
    }
  }, [filterDesignInProgress]);

  return (
    <div className='size-full flex flex-col'>
      <Navbar isBordered maxWidth='full' className='pr-4'>
        <NavbarBrand>
          <h1 className='font-bold font-mono'>FIR FILTER DESIGNER</h1>
        </NavbarBrand>
        <NavbarContent justify='end'>
          <Link
            color='foreground'
            href='https://github.com/dariusjlukas/filter-designer'
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
      <div className='h-full grid grid-cols-4 gap-2 content-stretch p-1 '>
        <Card>
          <CardHeader>
            <h1>Filter Settings</h1>
          </CardHeader>
          <CardBody>
            <Select
              isDisabled={filterDesignInProgress}
              disallowEmptySelection={true}
              selectedKeys={[outputDatatype]}
              onSelectionChange={(keys) =>
                setOutputDatatype(keys.currentKey as OutputDatatype)
              }
              selectionMode='single'
              label='Output Tap Datatype'
            >
              <SelectItem key='float64'>Float64</SelectItem>
            </Select>
            <Select
              className='mt-2'
              isDisabled={filterDesignInProgress}
              selectedKeys={designMethod}
              onSelectionChange={setDesignMethod}
              selectionMode='single'
              label='Design Method'
            >
              <SelectItem key='kaiserWindow'>Kaiser Window</SelectItem>
              <SelectItem key='parksMcClellan'>Parks-McClellan</SelectItem>
            </Select>
            {(designMethod as Set<string | number>).size === 0 ? (
              <></>
            ) : designMethod.currentKey === 'kaiserWindow' ? (
              <WindowMethodDesigner
                className='mt-2'
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
          <CardFooter className='flex flex-col gap-2'>
            {filterTaps.length !== 0 && !filterDesignInProgress ? (
              <Chip variant='faded'>
                Filter design finished! Number of taps: {filterTaps.length}.
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
        <Card className='col-span-3 h-full'>
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
                {filterTaps.length === 0 ? (
                  <h1>Design a filter to view its frequency response.</h1>
                ) : (
                  <ThreejsPlot
                    xValues={[...Array(frequencyResponse.length).keys()]}
                    yValues={frequencyResponse}
                    theme={theme}
                  />
                )}
              </Tab>
              <Tab
                className='h-full'
                key='Taps'
                title={
                  <>
                    <FontAwesomeIcon icon={faChartLine} />{' '}
                    <span className='px-1'>Filter Tap Plot</span>
                  </>
                }
              >
                {filterTaps.length === 0 ? (
                  <h1>Design a filter to view its taps.</h1>
                ) : (
                  <ThreejsPlot
                    xValues={[...Array(filterTaps.length).keys()]}
                    yValues={number(filterTaps) as number[]}
                    theme={theme}
                  />
                )}
              </Tab>
              <Tab
                className='h-full'
                key='Code'
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
                    '[' + filterTaps.map((v) => `${number(v).toString()}`) + ']'
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
