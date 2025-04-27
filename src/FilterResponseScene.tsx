/* eslint-disable react/no-unknown-property */
import { Canvas } from '@react-three/fiber';
import {
  Grid,
  Line,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { useMemo } from 'react';

export type FilterResponseSceneProps = {
  filterTaps: number[];
  theme: 'light' | 'dark'
};

export const FilterResponseScene = (props: FilterResponseSceneProps) => {
  const gridScalingFactor = 0.2;

  const plotPoints = useMemo(
    () =>
      props.filterTaps.map(
        (tapValue, index) =>
          new THREE.Vector3(
            index * gridScalingFactor - (Math.floor(props.filterTaps.length/2) * gridScalingFactor),
            tapValue * gridScalingFactor,
            0.01,
          ),
      ),
    [props.filterTaps],
  );

  return (
    <Canvas shadows className='size-full bg-default-100 rounded-lg'>
      <OrthographicCamera zoom={30} position={[0, 0, 10]} makeDefault />
      <OrbitControls minZoom={10} maxZoom={120} dampingFactor={0.3} enableRotate={false} makeDefault />
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        fadeDistance={100}
        fadeStrength={1}
        cellThickness={1}
        cellSize={gridScalingFactor}
        cellColor={props.theme === 'dark' ? new THREE.Color(0.01, 0.01, 0.01) : new THREE.Color(0.8,0.8,0.8)}
        sectionThickness={1}
        sectionSize={gridScalingFactor * 10}
        sectionColor={new THREE.Color(0.1, 0.3, 0.1)}
        followCamera
        rotation={new THREE.Euler(Math.PI / 2, 0, 0)}
      />
      <Line
        color={new THREE.Color(0, 0.6, 1)}
        lineWidth={3}
        points={plotPoints}
      />
    </Canvas>
  );
};
