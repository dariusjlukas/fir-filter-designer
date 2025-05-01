/* eslint-disable react/no-unknown-property */
import { Canvas, useThree } from '@react-three/fiber';
import {
  Grid,
  Html,
  Hud,
  Line,
  OrbitControls,
  OrthographicCamera,
  Plane,
} from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';
import { max, min } from 'mathjs';
import { linearMap } from './commonMath';

type AxisProps = {
  renderPriority: number;
  axis: 'x-axis' | 'y-axis';
  thickness: number;
  tickCount: number;
  scaleRange: [number, number];
  scaling: 'linear' | 'logarithmic';
  theme: string;
};

const AxisOverlay = (props: AxisProps) => {
  const { camera, viewport } = useThree();
  console.log(viewport.width / 2);

  const tickLocations = [...Array(props.tickCount).keys()].map((x) =>
    linearMap(x, 0, props.tickCount, -1, 1),
  );
  const tickValues = tickLocations.map((l) => l);

  return (
    <Hud renderPriority={props.renderPriority}>
      <OrthographicCamera
        makeDefault
        zoom={1}
        left={-1}
        right={1}
        top={1}
        bottom={-1}
        position={[0, 0, 10]}
      />
      <Plane
        position={new THREE.Vector3(-1 + props.thickness / 2, 0, 1)}
        args={[props.thickness, 2, 2, 2]}
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
      {tickLocations.map((l, index) => (
        <>
          <Line
            key={l}
            lineWidth={2}
            color={
              props.theme === 'dark'
                ? new THREE.Color(0.5, 0.8, 0.5)
                : new THREE.Color(0.9, 0.1, 0.1)
            }
            points={[
              new THREE.Vector3(-1 + (3 * props.thickness) / 4, l, 2),
              new THREE.Vector3(-1 + props.thickness, l, 2),
            ]}
          />
          <Html
            center
            position={new THREE.Vector3(-1 + props.thickness / 2 - 0.015, l, 2)}
          >
            {tickValues[index].toFixed(2)}
          </Html>
        </>
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
        left={-1.2}
        right={1.2}
        top={1.2}
        bottom={-1.2}
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
        cellSize={0.1}
        cellColor={
          props.theme === 'dark'
            ? new THREE.Color(0.01, 0.01, 0.01)
            : new THREE.Color(0.8, 0.8, 0.8)
        }
        sectionThickness={1}
        sectionSize={0.5}
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
        thickness={0.11}
        tickCount={10}
        scaleRange={[-1, 1]}
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
