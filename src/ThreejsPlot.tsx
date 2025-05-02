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
import { useMemo, useRef } from 'react';
import { max, min } from 'mathjs';
import { linearMap } from './commonMath';

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
};

const AxisOverlay = (props: AxisProps) => {
  const { camera, size } = useThree();

  const tickGroupRefs = useRef<Map<number, THREE.Group | null>>(new Map());
  const textRefs = useRef<
    Map<number, { text: string; scale: THREE.Vector3 } | null>
  >(new Map());

  const tickCount = Math.ceil(props.cameraHeight / props.tickSpacing);
  const ticks = [...Array(tickCount).keys()];

  useFrame(() => {
    tickGroupRefs.current.forEach((tick, i) => {
      const currentTickPosition = tick?.position;
      const tickCameraOffsetPosition =
        i * props.tickSpacing - camera.position.y;

      if (currentTickPosition !== undefined) {
        tick?.position.set(
          currentTickPosition.x,
          (((tickCameraOffsetPosition % props.cameraHeight) +
            props.cameraHeight) %
            props.cameraHeight) -
            props.cameraWidth / 2,
          currentTickPosition.z,
        );
      }
    });
    textRefs.current.forEach((textRef, i) => {
      const tickCameraOffsetPosition =
        i * props.tickSpacing - camera.position.y;
      const unwrappedIndex = Math.round(
        ((((tickCameraOffsetPosition % props.cameraHeight) +
          props.cameraHeight) %
          props.cameraHeight) +
          camera.position.y) /
          props.tickSpacing,
      );
      const scaleValue = linearMap(
        unwrappedIndex,
        0,
        tickCount,
        props.scaleRange[0],
        props.scaleRange[1],
      );
      if (textRef !== null && textRef !== undefined) {
        textRef.text = scaleValue.toFixed(2);
        textRef.scale.x = 35 / size.width;
        textRef.scale.y = 35 / size.height;
        // textRef.scale.y = aspectRatio;
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
        position={
          new THREE.Vector3(-props.cameraWidth / 2 + props.thickness / 2, 0, 1)
        }
        args={[props.thickness, props.cameraHeight, 2, 2]}
      >
        <meshBasicMaterial
          transparent
          opacity={0.9}
          color={
            props.theme === 'dark'
              ? new THREE.Color(0.04, 0.04, 0.04)
              : new THREE.Color(0.9, 0.85, 0.85)
          }
        />
      </Plane>
      {ticks.map((id) => (
        <group
          ref={(el) => {
            tickGroupRefs.current.set(id, el);
          }}
          position={new THREE.Vector3(-props.cameraWidth / 2, 0, 2)}
          key={id}
        >
          <Line
            lineWidth={2}
            color={
              props.theme === 'dark'
                ? new THREE.Color(0.5, 0.8, 0.5)
                : new THREE.Color(0.9, 0.1, 0.1)
            }
            points={[
              new THREE.Vector3((4 * props.thickness) / 5, 0, 2),
              new THREE.Vector3(props.thickness, 0, 2),
            ]}
          />
          <Text
            position={new THREE.Vector3(0.005, 0, 0)}
            anchorY='middle'
            anchorX='left'
            fontSize={1}
            ref={(el) => {
              textRefs.current.set(id, el);
            }}
          >
            0.0
          </Text>
        </group>
      ))}
    </Hud>
  );
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
              1,
            ),
            0.01,
          ),
      ),
    [props.xValues, props.yValues],
  );

  return (
    <Canvas className='size-full bg-default-100 rounded-lg'>
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
        minZoom={0.4}
        maxZoom={8}
        dampingFactor={0.3}
        enableRotate={false}
        makeDefault
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
        thickness={0.1}
        tickSpacing={sectionSize}
        scaleRange={[-1.2, 1.2]}
        cameraWidth={cameraWidth}
        cameraHeight={cameraHeight}
        scaling='logarithmic'
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
