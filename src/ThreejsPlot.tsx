import { Canvas } from '@react-three/fiber';
import {
  Grid,
  Line,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';
import { max, min } from 'mathjs';
import { linearMap } from './commonMath';

export type FilterResponseSceneProps = {
  xValues: number[];
  yValues: number[];
  xRange: [number, number];
  yRange: [number, number];
  theme: string;
};

export const ThreejsPlot = (props: FilterResponseSceneProps) => {
  const plotPoints = useMemo(
    () =>
      props.xValues.map(
        (xValue, index) =>
          new THREE.Vector3(
            linearMap(
              xValue,
              min(props.xValues),
              max(props.xValues),
              props.xRange[0],
              props.xRange[1],
            ),
            linearMap(
              props.yValues[index],
              min(props.yValues),
              max(props.yValues),
              props.yRange[0],
              props.yRange[1],
            ),
            0.01,
          ),
      ),
    [props.xValues, props.yValues],
  );

  return (
    <Canvas className='size-full bg-default-100 rounded-lg'>
      <OrthographicCamera zoom={30} position={[0, 0, 10]} makeDefault />
      <OrbitControls
        minZoom={10}
        maxZoom={400}
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
        cellSize={0.4}
        cellColor={
          props.theme === 'dark'
            ? new THREE.Color(0.01, 0.01, 0.01)
            : new THREE.Color(0.8, 0.8, 0.8)
        }
        sectionThickness={1}
        sectionSize={4}
        sectionColor={
          props.theme === 'dark'
            ? new THREE.Color(0.1, 0.2, 0.1)
            : new THREE.Color(0.3, 0.1, 0.1)
        }
        followCamera
        rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
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
