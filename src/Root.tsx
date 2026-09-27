import React from 'react';
import { Composition } from 'remotion';
import { MainVideo, defaultVideoProps, VideoProps } from './Composition';

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
          const width = Number(props.width) || 1080;
          const height = Number(props.height) || 1920;
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
