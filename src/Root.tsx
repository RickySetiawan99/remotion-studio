import React from 'react';
import { Composition } from 'remotion';
import { MainVideo, defaultVideoProps, VideoProps, AspectRatioId } from './Composition';

const ASPECT_DIMS: Record<string, { width: number; height: number }> = {
  portrait: { width: 1080, height: 1920 },
  landscape: { width: 1920, height: 1080 },
  square: { width: 1080, height: 1080 },
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
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
          // V2: aspect ratio support
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
    </>
  );
};
