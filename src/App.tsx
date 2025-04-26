import { faGithub } from '@fortawesome/free-brands-svg-icons';
import {
  faChartSimple,
  faCode,
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
} from '@heroui/react';
import { useTheme } from '@heroui/use-theme';
import { useEffect, useState } from 'react';
import { WindowMethodDesigner } from './WindowMethodDesigner';

export const App = () => {
  const { theme, setTheme } = useTheme('dark');

  const [filterDesignInProgress, setFilterDesignInProgress] = useState(false);
  const [filterTaps, setFilterTaps] = useState<number[]>([]);
  const [designMethod, setDesignMethod] = useState<SharedSelection>(
    new Set([]),
  );

  useEffect(() => {
    console.log(designMethod);
  }, [designMethod]);

  return (
    <div className='size-full flex flex-col'>
      <Navbar isBordered maxWidth='2xl'>
        <NavbarBrand>
          <h1 className='font-bold font-mono'>FIR FILTER DESIGNER</h1>
        </NavbarBrand>
        <NavbarContent justify='end'>
          <Link color='foreground' href='https://www.github.com'>
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
              selectedKeys={designMethod}
              onSelectionChange={setDesignMethod}
              selectionMode='single'
              label='Design Method'
            >
              <SelectItem key='windowMethod'>Window Method</SelectItem>
              <SelectItem key='parksMcClellan'>Parks-McClellan</SelectItem>
            </Select>
            {(designMethod as Set<string | number>).size === 0 ? (
              <></>
            ) : designMethod.currentKey === 'windowMethod' ? (
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
          <CardFooter>
            <Button
              className='w-full'
              color='primary'
              isLoading={filterDesignInProgress}
              onPress={() => {
                addToast({ title: 'Design in Progress' });
                setFilterDesignInProgress(true);
              }}
            >
              Design Filter
            </Button>
          </CardFooter>
        </Card>
        <Card className='col-span-3 h-full'>
          <CardBody>
            <Tabs radius='lg'>
              <Tab
                key='Filter Response'
                title={
                  <>
                    <FontAwesomeIcon icon={faChartSimple} />{' '}
                    <span className='px-1'>Filter Response</span>
                  </>
                }
              >
                Filter Response
              </Tab>
              <Tab
                key='Taps'
                title={
                  <>
                    <FontAwesomeIcon icon={faList} />{' '}
                    <span className='px-1'>Filter Taps</span>
                  </>
                }
              >
                Taps...
              </Tab>
              <Tab
                key='Code'
                title={
                  <>
                    <FontAwesomeIcon icon={faCode} />{' '}
                    <span className='px-1'>Code</span>
                  </>
                }
              >
                Code...
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default App;
