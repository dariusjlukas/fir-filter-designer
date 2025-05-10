/* eslint-disable react/no-unknown-property */
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  Circle,
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
import { Line2, OrbitControls as OrbitControlsImpl } from 'three-stdlib';

const lightModeLineColors = [
  new THREE.Color(0, 0.2, 1),
  new THREE.Color(1, 0.2, 0),
];
const darkModeLineColors = [
  new THREE.Color(0, 0.4, 1),
  new THREE.Color(1, 0.4, 0),
];

type AxisOverlayProps = {
  renderPriority: number;
  axis: 'x-axis' | 'y-axis';
  thickness: number;
  tickSpacing: number;
  scaleRange: [number, number];
  cameraWidth: number;
  cameraHeight: number;
  theme: string;
  labelDecimalPlaces: number;
  setPointerOverAxis: (value: boolean) => void;
  hovered: boolean;
  setHovered: (value: boolean) => void;
  pointerDown: boolean;
};

type DreiTextRef = { text: string; scale: THREE.Vector3 };

const AxisOverlay = (props: AxisOverlayProps) => {
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
        textRef.text = scaledValue.toFixed(props.labelDecimalPlaces);
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
                -cameraOffAxisLength / 2 +
                  props.thickness / size.width / 2 -
                  0.05,
                0,
                1
              )
            : new THREE.Vector3(
                0,
                -cameraOffAxisLength / 2 +
                  props.thickness / size.height / 2 -
                  0.05,
                1
              )
        }
        args={
          props.axis == 'y-axis'
            ? [props.thickness / size.width + 0.1, cameraInlineLength, 2, 2]
            : [cameraInlineLength, props.thickness / size.height + 0.1, 2, 2]
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
            ref={(el) => {
              textRefs.current.set(tickIndex, el as DreiTextRef);
            }}
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
          >
            0.0
          </Text>
        </group>
      ))}
    </Hud>
  );
};

type CrosshairProps = {
  theme: string;
  renderPriority: number;
  cameraWidth: number;
  cameraHeight: number;
  pointerOverCanvas: boolean;
  axisHovered: boolean;
  xAxisThickness: number;
  yAxisThickness: number;
  xScaleRange: [number, number];
  yScaleRange: [number, number];
  xLabelDecimalPlaces: number;
  yLabelDecimalPlaces: number;
};

const Crosshair = (props: CrosshairProps) => {
  const { size } = useThree();
  const xLineRef = useRef<Line2>(null);
  const yLineRef = useRef<Line2>(null);

  const textGroupRefs = useRef<Map<string, THREE.Group | null>>(new Map());
  const textRefs = useRef<Map<string, DreiTextRef | null>>(new Map());

  const axisList = ['x-axis', 'y-axis'];

  useFrame((rootState) => {
    const scaledPointerCoordinates = [
      linearMap(
        rootState.pointer.x,
        -1,
        1,
        -props.cameraWidth / 2,
        props.cameraWidth / 2
      ),
      linearMap(
        rootState.pointer.y,
        -1,
        1,
        -props.cameraHeight / 2,
        props.cameraHeight / 2
      ),
    ];
    if (xLineRef.current) {
      xLineRef.current.position.set(scaledPointerCoordinates[0], 0, 0);
    }
    if (yLineRef.current) {
      yLineRef.current.position.set(0, scaledPointerCoordinates[1], 0);
    }

    axisList.forEach((axis) => {
      const textGroup = textGroupRefs.current.get(axis);
      const currentTextPosition = textGroup?.position;

      if (currentTextPosition !== undefined) {
        if (axis === 'y-axis') {
          textGroup?.position.set(
            currentTextPosition.x,
            scaledPointerCoordinates[1],
            currentTextPosition.z
          );
        } else {
          textGroup?.position.set(
            scaledPointerCoordinates[0],
            currentTextPosition.y,
            currentTextPosition.z
          );
        }
      }

      const textRef = textRefs.current.get(axis);
      const scaledValue =
        axis === 'y-axis'
          ? linearMap(
              rootState.pointer.y +
                linearMap(
                  rootState.camera.position.y,
                  -props.cameraHeight / 2,
                  props.cameraHeight / 2,
                  -1,
                  1
                ),
              -1,
              1,
              props.yScaleRange[0],
              props.yScaleRange[1]
            )
          : linearMap(
              rootState.pointer.x +
                linearMap(
                  rootState.camera.position.x,
                  -props.cameraWidth / 2,
                  props.cameraWidth / 2,
                  -1,
                  1
                ),
              -1,
              1,
              props.xScaleRange[0],
              props.xScaleRange[1]
            );
      if (textRef !== null && textRef !== undefined) {
        // Keep the text a consistent size, regardless the the canvas size
        textRef.text =
          axis === 'y-axis'
            ? (
                Math.round(
                  (scaledValue + Number.EPSILON) *
                    10 ** props.yLabelDecimalPlaces
                ) /
                10 ** props.yLabelDecimalPlaces
              ).toFixed(props.yLabelDecimalPlaces)
            : (
                Math.round(
                  (scaledValue + Number.EPSILON) *
                    10 ** props.xLabelDecimalPlaces
                ) /
                10 ** props.xLabelDecimalPlaces
              ).toFixed(props.xLabelDecimalPlaces);
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
      <Line
        ref={xLineRef}
        color={
          props.theme === 'dark'
            ? new THREE.Color(0.5, 0.8, 0.5)
            : new THREE.Color(0, 0, 0)
        }
        visible={props.pointerOverCanvas && !props.axisHovered}
        points={[
          new THREE.Vector3(
            0,
            -props.cameraHeight / 2 + (props.xAxisThickness - 15) / size.height,
            4
          ),
          new THREE.Vector3(0, props.cameraHeight / 2, 4),
        ]}
      />
      <Line
        ref={yLineRef}
        color={
          props.theme === 'dark'
            ? new THREE.Color(0.5, 0.8, 0.5)
            : new THREE.Color(0, 0, 0)
        }
        visible={props.pointerOverCanvas && !props.axisHovered}
        points={[
          new THREE.Vector3(
            -props.cameraWidth / 2 + (props.yAxisThickness - 15) / size.width,
            0,
            5
          ),
          new THREE.Vector3(props.cameraWidth / 2, 0, 5),
        ]}
      />
      {axisList.map((axis) => (
        <group
          visible={props.pointerOverCanvas && !props.axisHovered}
          ref={(el) => {
            textGroupRefs.current.set(axis, el);
          }}
          position={
            axis === 'y-axis'
              ? new THREE.Vector3(-props.cameraWidth / 2, 0, 2)
              : new THREE.Vector3(0, -props.cameraHeight / 2, 0)
          }
          key={axis}
        >
          <Plane
            args={
              axis === 'y-axis'
                ? [props.yAxisThickness / size.width, 50 / size.height, 2, 2]
                : [140 / size.width, props.xAxisThickness / size.height, 2, 2]
            }
            position={
              axis === 'y-axis'
                ? new THREE.Vector3(props.yAxisThickness / size.width / 2, 0, 2)
                : new THREE.Vector3(
                    0,
                    props.xAxisThickness / size.height / 2,
                    2
                  )
            }
          >
            <meshBasicMaterial
              color={
                props.theme === 'dark'
                  ? new THREE.Color(0.04, 0.04, 0.04)
                  : new THREE.Color(0.9, 0.85, 0.85)
              }
            />
          </Plane>
          <Text
            ref={(el) => {
              textRefs.current.set(axis, el as DreiTextRef);
            }}
            color={
              props.theme === 'dark'
                ? new THREE.Color(0.8, 0.8, 0.8)
                : new THREE.Color(0.05, 0.05, 0.05)
            }
            position={
              axis === 'y-axis'
                ? new THREE.Vector3(10 / size.width, 0, 3)
                : new THREE.Vector3(0, 10 / size.height, 3)
            }
            anchorY={axis === 'y-axis' ? 'middle' : 'bottom'}
            anchorX={axis === 'y-axis' ? 'left' : 'center'}
            fontSize={1}
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

type DataDisplayProps = {
  plotType: 'line' | 'point';
  theme: string;
  xValues: number[];
  yValues: number[][];
};

const DataDisplay = (props: DataDisplayProps) => {
  const { size } = useThree();

  const plotPoints = useMemo(() => {
    const plotPointsArray: THREE.Vector3[][] = [];
    // Initialize plot points array
    props.yValues.forEach(() => plotPointsArray.push([]));
    for (
      let xValuesIndex = 0;
      xValuesIndex < props.xValues.length;
      xValuesIndex++
    ) {
      props.yValues.forEach((yValueArray, yValuesIndex) =>
        plotPointsArray[yValuesIndex].push(
          new THREE.Vector3(
            linearMap(
              props.xValues[xValuesIndex],
              min(props.xValues),
              max(props.xValues),
              -1,
              1
            ),
            linearMap(
              yValueArray[xValuesIndex],
              min(props.yValues.flat()),
              max(props.yValues.flat()),
              -1,
              1
            ),
            0.01
          )
        )
      );
    }
    return plotPointsArray;
  }, [props.xValues, props.yValues]);

  return (
    <>
      {/* Plot data set(s) */}
      {plotPoints.map((linePoints, i) =>
        props.plotType === 'line' ? (
          <Line
            key={i}
            color={
              props.theme === 'dark'
                ? darkModeLineColors[i]
                : lightModeLineColors[i]
            }
            lineWidth={3}
            points={linePoints}
          />
        ) : (
          linePoints.map((point, pointIndex) => (
            <>
              <Line
                key={'line-' + pointIndex}
                points={[
                  new THREE.Vector3(
                    point.x,
                    linearMap(
                      0,
                      min(props.yValues.flat()),
                      max(props.yValues.flat()),
                      -1,
                      1
                    ),
                    point.z
                  ),
                  new THREE.Vector3(point.x, point.y, point.z),
                ]}
                color={
                  props.theme === 'dark'
                    ? darkModeLineColors[i]
                    : lightModeLineColors[i]
                }
                lineWidth={2}
              />
              <Circle
                key={'circle-' + pointIndex}
                position={point}
                args={[1, 16]}
                scale={[10 / size.width, 10 / size.height, 1]}
              >
                <meshBasicMaterial
                  color={
                    props.theme === 'dark'
                      ? darkModeLineColors[i]
                      : lightModeLineColors[i]
                  }
                />
              </Circle>
            </>
          ))
        )
      )}
    </>
  );
};

type CameraBoundsFixProps = {
  cameraWidth: number;
  cameraHeight: number;
};

const CameraBoundsFix = (props: CameraBoundsFixProps) => {
  const { camera } = useThree();

  const typedCamera = camera as THREE.OrthographicCamera;
  useFrame(() => {
    typedCamera.left = -props.cameraWidth / 2;
    typedCamera.right = props.cameraWidth / 2;
    typedCamera.top = props.cameraHeight / 2;
    typedCamera.bottom = -props.cameraHeight / 2;
  });
  return <></>;
};

export type ThreejsPlotProps = {
  xValues: number[];
  yValues: number[][];
  theme: string;
  plotType: 'line' | 'point';
};

export const ThreejsPlot = (props: ThreejsPlotProps) => {
  const cellSize = 0.05;
  const sectionSize = 0.2;
  const cameraWidth = 2.4;
  const cameraHeight = 2.4;
  const xAxisThickness = 80;
  const yAxisThickness = 150;

  const xScaleRange: [number, number] = [
    linearMap(-cameraWidth / 2, -1, 1, min(props.xValues), max(props.xValues)),
    linearMap(cameraWidth / 2, -1, 1, min(props.xValues), max(props.xValues)),
  ];
  const yScaleRange: [number, number] = [
    linearMap(
      -cameraHeight / 2,
      -1,
      1,
      min(props.yValues) as number,
      max(props.yValues) as number
    ),
    linearMap(
      cameraHeight / 2,
      -1,
      1,
      min(props.yValues) as number,
      max(props.yValues) as number
    ),
  ];

  const [xAxisHovered, setXAxisHovered] = useState(false);
  const [pointerOverXAxis, setPointerOverXAxis] = useState(false);
  const [yAxisHovered, setYAxisHovered] = useState(false);
  const [pointerOverYAxis, setPointerOverYAxis] = useState(false);
  const [pointerDown, setPointerDown] = useState(false);
  const [pointerOverCanvas, setPointerOverCanvas] = useState(false);

  const orbitControlsRef = useRef<OrbitControlsImpl>(null);

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
      className={`size-full bg-default-100 rounded-lg ${!xAxisHovered && !yAxisHovered ? 'cursor-none' : ''} ${xAxisHovered ? 'cursor-ew-resize' : ''} ${yAxisHovered ? 'cursor-ns-resize' : ''}`}
      onPointerEnter={() => {
        setPointerOverCanvas(true);
      }}
      onPointerLeave={() => {
        setPointerOverCanvas(false);
      }}
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
      <CameraBoundsFix cameraWidth={cameraWidth} cameraHeight={cameraHeight} />
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
      <Crosshair
        theme={props.theme}
        renderPriority={3}
        xLabelDecimalPlaces={3}
        yLabelDecimalPlaces={2}
        xScaleRange={xScaleRange}
        yScaleRange={yScaleRange}
        xAxisThickness={xAxisThickness}
        yAxisThickness={yAxisThickness}
        pointerOverCanvas={pointerOverCanvas}
        axisHovered={
          xAxisHovered || yAxisHovered || pointerOverXAxis || pointerOverYAxis
        }
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
      />
      <AxisOverlay
        theme={props.theme}
        renderPriority={1}
        axis={'x-axis'}
        thickness={xAxisThickness}
        tickSpacing={sectionSize}
        scaleRange={xScaleRange}
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        labelDecimalPlaces={3}
        setPointerOverAxis={setPointerOverXAxis}
        hovered={xAxisHovered}
        setHovered={setXAxisHovered}
        pointerDown={pointerDown}
      />
      <AxisOverlay
        theme={props.theme}
        renderPriority={2}
        axis={'y-axis'}
        thickness={yAxisThickness}
        tickSpacing={sectionSize}
        scaleRange={yScaleRange}
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        labelDecimalPlaces={2}
        setPointerOverAxis={setPointerOverYAxis}
        hovered={yAxisHovered}
        setHovered={setYAxisHovered}
        pointerDown={pointerDown}
      />
      <DataDisplay
        xValues={props.xValues}
        yValues={props.yValues}
        theme={props.theme}
        plotType={props.plotType}
      />
    </Canvas>
  );
};
