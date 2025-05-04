/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Grid,
  Hud,
  Line,
  OrbitControls,
  OrthographicCamera,
  Plane,
  Text,
} from '@react-three/drei';
import * as THREE from 'three';
import {
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { max, min } from 'mathjs';
import { linearMap } from './commonMath';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

type AxisProps = {
  renderPriority: number;
  axis: 'x-axis' | 'y-axis';
  thickness: number;
  tickSpacing: number;
  scaleRange: [number, number];
  scaling: 'linear' | 'logarithmic';
  cameraWidth: number;
  cameraHeight: number;
  theme: string;
  setPointerOverAxis: (value: boolean) => void;
  hovered: boolean;
  setHovered: (value: boolean) => void;
  pointerDown: boolean;
};

type DreiTextRef = { text: string; scale: THREE.Vector3 };

const AxisOverlay = (props: AxisProps) => {
  const { camera, size } = useThree();

  const tickGroupRefs = useRef<Map<number, THREE.Group | null>>(new Map());
  const textRefs = useRef<Map<number, DreiTextRef | null>>(new Map());

  const cameraInlineLength =
    props.axis === 'y-axis' ? props.cameraHeight : props.cameraWidth;
  const cameraOffAxisLength =
    props.axis === 'y-axis' ? props.cameraWidth : props.cameraHeight;

  // const [tickCount, setTickCount] = useState(Math.ceil(cameraInlineLength / props.tickSpacing));
  const tickCount = Math.ceil(cameraInlineLength / props.tickSpacing);

  useFrame(() => {
    // const calculatedTickCount = Math.ceil(cameraInlineLength / (props.tickSpacing * camera.zoom))
    // if(calculatedTickCount !== tickCount){
    //   setTickCount(calculatedTickCount)
    // }

    const cameraInlinePosition =
      props.axis === 'y-axis' ? camera.position.y : camera.position.x;

    tickGroupRefs.current.forEach((tick, i) => {
      const currentTickPosition = tick?.position;
      const tickCameraOffsetPosition =
        (i * props.tickSpacing -
          cameraInlinePosition -
          (tickCount / 2) * props.tickSpacing) *
          camera.zoom +
        (tickCount / 2) * props.tickSpacing;

      if (currentTickPosition !== undefined) {
        const tickWrappedPosition =
          (((tickCameraOffsetPosition % cameraInlineLength) +
            cameraInlineLength) %
            cameraInlineLength) -
          cameraInlineLength / 2;
        if (props.axis === 'y-axis') {
          tick?.position.set(
            currentTickPosition.x,
            tickWrappedPosition,
            currentTickPosition.z
          );
        } else {
          tick?.position.set(
            tickWrappedPosition,
            currentTickPosition.y,
            currentTickPosition.z
          );
        }
      }
    });
    textRefs.current.forEach((textRef, i) => {
      const tickCameraOffsetPosition =
        (i * props.tickSpacing -
          cameraInlinePosition -
          (tickCount / 2) * props.tickSpacing) *
          camera.zoom +
        (tickCount / 2) * props.tickSpacing;
      const unwrappedIndex = Math.round(
        ((((tickCameraOffsetPosition % cameraInlineLength) +
          cameraInlineLength) %
          cameraInlineLength) +
          cameraInlinePosition) /
          (props.tickSpacing / camera.zoom)
      );
      const scaledValue = linearMap(
        unwrappedIndex,
        0,
        tickCount,
        props.scaleRange[0],
        props.scaleRange[1]
      );
      if (textRef !== null && textRef !== undefined) {
        // Keep the text a consistent size, regardless the the canvas size
        textRef.text = scaledValue.toFixed(2);
        textRef.scale.x = 35 / size.width;
        textRef.scale.y = 35 / size.height;
      }
    });
  });

  return (
    <Hud renderPriority={props.renderPriority}>
      <OrthographicCamera
        makeDefault
        zoom={1}
        left={-props.cameraWidth / 2}
        right={props.cameraWidth / 2}
        top={props.cameraHeight / 2}
        bottom={-props.cameraHeight / 2}
        position={[0, 0, 10]}
      />
      <Plane
        onPointerOver={() => {
          props.setPointerOverAxis(true);
          if (!props.pointerDown) {
            props.setHovered(true);
          }
        }}
        onPointerLeave={() => {
          props.setPointerOverAxis(false);
          if (!props.pointerDown) {
            props.setHovered(false);
          }
        }}
        position={
          props.axis === 'y-axis'
            ? new THREE.Vector3(
                -cameraOffAxisLength / 2 + props.thickness / size.width / 2,
                0,
                1
              )
            : new THREE.Vector3(
                0,
                -cameraOffAxisLength / 2 + props.thickness / size.height / 2,
                1
              )
        }
        args={
          props.axis == 'y-axis'
            ? [props.thickness / size.width, cameraInlineLength, 2, 2]
            : [cameraInlineLength, props.thickness / size.height, 2, 2]
        }
      >
        <meshBasicMaterial
          transparent
          opacity={props.hovered ? 1 : 0.9}
          color={
            props.theme === 'dark'
              ? new THREE.Color(0.04, 0.04, 0.04)
              : new THREE.Color(0.9, 0.85, 0.85)
          }
        />
      </Plane>
      {[...Array(tickCount).keys()].map((tickIndex) => (
        <group
          ref={(el) => {
            tickGroupRefs.current.set(tickIndex, el);
          }}
          position={
            props.axis === 'y-axis'
              ? new THREE.Vector3(-props.cameraWidth / 2, 0, 2)
              : new THREE.Vector3(0, -props.cameraHeight / 2, 0)
          }
          key={tickIndex}
        >
          <Line
            lineWidth={2}
            color={
              props.theme === 'dark'
                ? new THREE.Color(0.5, 0.8, 0.5)
                : new THREE.Color(0.9, 0.1, 0.1)
            }
            points={
              props.axis === 'y-axis'
                ? [
                    new THREE.Vector3(
                      (props.thickness - 15) / size.width,
                      0,
                      2
                    ),
                    new THREE.Vector3(props.thickness / size.width, 0, 2),
                  ]
                : [
                    new THREE.Vector3(
                      0,
                      (props.thickness - 15) / size.height,
                      2
                    ),
                    new THREE.Vector3(0, props.thickness / size.height, 2),
                  ]
            }
          />
          <Text
            color={
              props.theme === 'dark'
                ? new THREE.Color(0.8, 0.8, 0.8)
                : new THREE.Color(0.05, 0.05, 0.05)
            }
            position={
              props.axis === 'y-axis'
                ? new THREE.Vector3(10 / size.width, 0, 3)
                : new THREE.Vector3(0, 10 / size.height, 3)
            }
            anchorY={props.axis === 'y-axis' ? 'middle' : 'bottom'}
            anchorX={props.axis === 'y-axis' ? 'left' : 'center'}
            fontSize={1}
            ref={(el) => {
              textRefs.current.set(tickIndex, el as DreiTextRef);
            }}
          >
            0.0
          </Text>
        </group>
      ))}
    </Hud>
  );
};

type ControlsLockingHandlerProps = {
  orbitControlsRef: RefObject<OrbitControlsImpl | null>;
  xAxisHovered: boolean;
  yAxisHovered: boolean;
};

const ControlsLockingHandler = (props: ControlsLockingHandlerProps) => {
  const lastCameraCoordinated = useRef({ x: 0, y: 0 });

  useFrame((rootState) => {
    if (props.orbitControlsRef.current !== null) {
      if (props.xAxisHovered) {
        props.orbitControlsRef.current.target.y =
          lastCameraCoordinated.current.y;
        rootState.camera.position.y = lastCameraCoordinated.current.y;
      } else if (props.yAxisHovered) {
        props.orbitControlsRef.current.target.x =
          lastCameraCoordinated.current.x;
        rootState.camera.position.x = lastCameraCoordinated.current.x;
      }
    }
    lastCameraCoordinated.current.x = rootState.camera.position.x;
    lastCameraCoordinated.current.y = rootState.camera.position.y;
  });

  return <></>;
};

export type FilterResponseSceneProps = {
  xValues: number[];
  yValues: number[];
  theme: string;
};

export const ThreejsPlot = (props: FilterResponseSceneProps) => {
  const cellSize = 0.05;
  const sectionSize = 0.2;
  const cameraWidth = 2.4;
  const cameraHeight = 2.4;

  const xScaleRange: [number, number] = [
    linearMap(-cameraWidth / 2, -1, 1, min(props.xValues), max(props.xValues)),
    linearMap(cameraWidth / 2, -1, 1, min(props.xValues), max(props.xValues)),
  ];
  const yScaleRange: [number, number] = [
    linearMap(-cameraHeight / 2, -1, 1, min(props.yValues), max(props.yValues)),
    linearMap(cameraHeight / 2, -1, 1, min(props.yValues), max(props.yValues)),
  ];

  const [xAxisHovered, setXAxisHovered] = useState(false);
  const [pointerOverXAxis, setPointerOverXAxis] = useState(false);
  const [yAxisHovered, setYAxisHovered] = useState(false);
  const [pointerOverYAxis, setPointerOverYAxis] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

  const plotPoints = useMemo(
    () =>
      props.xValues.map(
        (xValue, index) =>
          new THREE.Vector3(
            linearMap(xValue, min(props.xValues), max(props.xValues), -1, 1),
            linearMap(
              props.yValues[index],
              min(props.yValues),
              max(props.yValues),
              -1,
              1
            ),
            0.01
          )
      ),
    [props.xValues, props.yValues]
  );

  const handlePointerUp = useCallback(() => {
    setPointerDown(false);
    if (!pointerOverXAxis) {
      setXAxisHovered(false);
    } else {
      setXAxisHovered(true);
    }
    if (!pointerOverYAxis) {
      setYAxisHovered(false);
    } else {
      setYAxisHovered(true);
    }
  }, [pointerOverXAxis, pointerOverYAxis]);

  useEffect(() => {
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerUp]);

  return (
    <Canvas
      className={`size-full bg-default-100 rounded-lg ${xAxisHovered ? 'cursor-ew-resize' : ''} ${yAxisHovered ? 'cursor-ns-resize' : ''}`}
      onPointerDown={() => {
        setPointerDown(true);
      }}
    >
      <OrthographicCamera
        left={-cameraWidth / 2}
        right={cameraWidth / 2}
        top={cameraHeight / 2}
        bottom={-cameraHeight / 2}
        zoom={1}
        position={[0, 0, 10]}
        makeDefault
      />
      <OrbitControls
        ref={orbitControlsRef}
        mouseButtons={{ LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY }}
        minZoom={1}
        maxZoom={1}
        dampingFactor={0.5}
        enableRotate={false}
        makeDefault
      />
      <ControlsLockingHandler
        orbitControlsRef={orbitControlsRef}
        xAxisHovered={xAxisHovered}
        yAxisHovered={yAxisHovered}
      />
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        fadeDistance={100}
        fadeStrength={1}
        cellThickness={1}
        cellSize={cellSize}
        cellColor={
          props.theme === 'dark'
            ? new THREE.Color(0.01, 0.01, 0.01)
            : new THREE.Color(0.8, 0.8, 0.8)
        }
        sectionThickness={1}
        sectionSize={sectionSize}
        sectionColor={
          props.theme === 'dark'
            ? new THREE.Color(0.1, 0.2, 0.1)
            : new THREE.Color(0.3, 0.1, 0.1)
        }
        followCamera
        rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
      />
      <AxisOverlay
        theme={props.theme}
        renderPriority={1}
        axis={'x-axis'}
        thickness={80}
        tickSpacing={sectionSize}
        scaleRange={xScaleRange}
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        scaling='logarithmic'
        setPointerOverAxis={setPointerOverXAxis}
        hovered={xAxisHovered}
        setHovered={setXAxisHovered}
        pointerDown={pointerDown}
      />
      <AxisOverlay
        theme={props.theme}
        renderPriority={2}
        axis={'y-axis'}
        thickness={150}
        tickSpacing={sectionSize}
        scaleRange={yScaleRange}
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        scaling='logarithmic'
        setPointerOverAxis={setPointerOverYAxis}
        hovered={yAxisHovered}
        setHovered={setYAxisHovered}
        pointerDown={pointerDown}
      />
      <Line
        color={
          props.theme === 'dark'
            ? new THREE.Color(0, 0.4, 1)
            : new THREE.Color(0, 0.2, 1)
        }
        lineWidth={3}
        points={plotPoints}
      />
    </Canvas>
  );
};
