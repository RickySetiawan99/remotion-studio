import React from 'react';
import { Composition } from 'remotion';
import { MainVideo, defaultVideoProps, VideoProps, AspectRatioId } from './Composition';
import { ThreeDMainVideo, defaultThreeDProps, ThreeDVideoProps } from './ThreeDComposition';

const ASPECT_DIMS: Record<string, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 2D Programmatic Video Composition */}
      <Composition<any, VideoProps>
        id="MotionCraftVideo"
        component={MainVideo}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultVideoProps}
        calculateMetadata={({ props }: { props: VideoProps }) => {
          const fps = 30;
          const durationSec = Number(props.durationSec) || 60;
          const ratio = (props.aspectRatio as string) || 'portrait';
          const dims = ASPECT_DIMS[ratio] || ASPECT_DIMS.portrait;
          const width = Number(props.width) || dims.width;
          const height = Number(props.height) || dims.height;
          return {
            durationInFrames: Math.round(durationSec * fps),
            fps,
            width,
            height,
          };
        }}
      />

      {/* 3D WebGL Three.js Animation Composition */}
      <Composition<any, ThreeDVideoProps>
        id="MotionCraft3D"
        component={ThreeDMainVideo}
        durationInFrames={150} // 5s @ 30fps default
        fps={30}
        width={1080}
        height={1920}
        defaultProps={defaultThreeDProps}
        calculateMetadata={({ props }: { props: ThreeDVideoProps }) => {
          const fps = 30;
          const durationSec = Number(props.durationSec) || 5;
          const ratio = (props.aspectRatio as string) || 'portrait';
          const dims = ASPECT_DIMS[ratio] || ASPECT_DIMS.portrait;
          return {
            durationInFrames: Math.round(durationSec * fps),
            fps,
            width: dims.width,
            height: dims.height,
          };
        }}
      />
    </>
  );
};
