import React, { useContext, useEffect, useState } from "react";
import Spritesheet from "components/animation/SpriteAnimator";
import classNames from "classnames";
import {
  BumpkinBody,
  BumpkinHair,
  BumpkinBackground,
  BumpkinShoe,
  BumpkinTool,
  BumpkinAura,
  Equipped,
} from "features/game/types/bumpkin";
import { PIXEL_SCALE } from "features/game/lib/constants";
import { BumpkinParts } from "lib/utils/tokenUriBuilder";
import shadow from "assets/npcs/shadow.png";
import { ZoomContext } from "components/ZoomProvider";
import { SpringValue } from "react-spring";
import { ITEM_IDS } from "features/game/types/bumpkin";
import { CONFIG } from "lib/config";
import {
  getAnimatedWebpUrl,
  getAnimationUrl,
} from "features/world/lib/animations";
import silhouette from "assets/npcs/silhouette.webp";

const FRAME_WIDTH = 180 / 9;
const FRAME_HEIGHT = 19;
const STEPS = 9;
const AURA_WIDTH = 160 / 8;
const AURA_STEPS = 8;

export type NPCParts = Omit<
  BumpkinParts,
  "background" | "hair" | "body" | "shoes" | "tool" | "aura"
> &
  Equipped;

export interface NPCProps {
  parts: Partial<NPCParts> | undefined;
  flip?: boolean;
  hideShadow?: boolean;
  preventZoom?: boolean;
  width?: number; // Add width prop
}

export const NPC: React.FC<NPCProps & { onClick?: () => void }> = ({
  parts,
  flip,
  hideShadow,
  onClick,
  preventZoom,
  width = PIXEL_SCALE * 16, // Default to original width if not passed
}) => {
  const { scale } = useContext(ZoomContext);
  const [show, setShow] = useState(false);

  useEffect(() => {
    setShow(true);
  }, []);

  const NPCparts = parts as Partial<NPCParts>;

  const idle = getAnimationUrl(NPCparts, "idle_small");
  const auraBack =
    NPCparts.aura &&
    `${CONFIG.PROTECTED_IMAGE_URL}/aura/back/${ITEM_IDS[NPCparts.aura]}.png`;
  const auraFront =
    NPCparts.aura &&
    `${CONFIG.PROTECTED_IMAGE_URL}/aura/front/${ITEM_IDS[NPCparts.aura]}.png`;

  if (!show) {
    return null;
  }

  return (
    <>
      <div
        className={classNames(`absolute `, {
          "cursor-pointer hover:img-highlight": !!onClick,
          "-scale-x-100": !!flip,
        })}
        onClick={() => !!onClick && onClick()}
        style={{
          width: `${width}px`, // Use passed width for character
          height: `${width * 2}px`, // Adjust height based on the width
        }}
      >
        <>
          {!hideShadow && (
            <img
              src={shadow}
              style={{
                width: `${width * 0.94}px`, // Scale shadow based on width
                top: `${width * 1.25}px`,
                left: `${width * 0.06}px`,
              }}
              className="absolute pointer-events-none"
            />
          )}
          {auraBack && (
            <Spritesheet
              className="absolute w-full inset-0 pointer-events-none"
              style={{
                width: `${width * 1.25}px`,
                top: `${width * 0.125}px`,
                left: `${width * -0.125}px`,
                imageRendering: "pixelated" as const,
              }}
              image={auraBack}
              widthFrame={AURA_WIDTH}
              heightFrame={FRAME_HEIGHT}
              zoomScale={preventZoom ? new SpringValue(1) : scale}
              steps={AURA_STEPS}
              fps={14}
              autoplay={true}
              loop={true}
            />
          )}
          <Spritesheet
            className="absolute w-full inset-0 pointer-events-none"
            style={{
              width: `${width * 1.25}px`,
              top: `${width * 0.31}px`,
              left: `${width * -0.125}px`,
              imageRendering: "pixelated" as const,
            }}
            image={idle}
            widthFrame={FRAME_WIDTH}
            heightFrame={FRAME_HEIGHT}
            zoomScale={preventZoom ? new SpringValue(1) : scale}
            steps={STEPS}
            fps={14}
            autoplay={true}
            loop={true}
          />
          {auraFront && (
            <Spritesheet
              className="absolute w-full inset-0 pointer-events-none"
              style={{
                width: `${width * 1.25}px`,
                top: `${width * 0.44}px`,
                left: `${width * -0.125}px`,
                imageRendering: "pixelated" as const,
              }}
              image={auraFront}
              widthFrame={AURA_WIDTH}
              heightFrame={FRAME_HEIGHT}
              zoomScale={preventZoom ? new SpringValue(1) : scale}
              steps={AURA_STEPS}
              fps={14}
              autoplay={true}
              loop={true}
            />
          )}
        </>
      </div>
    </>
  );
};

export const NPCIcon: React.FC<NPCProps> = ({
  parts,
  hideShadow,
  width = PIXEL_SCALE * 14,
}) => {
  const [loaded, setLoaded] = useState(false);

  const NPCparts = parts as Partial<NPCParts>;

  const idle = getAnimatedWebpUrl(NPCparts, ["idle_small"]);
  const auraBack =
    NPCparts.aura &&
    `${CONFIG.PROTECTED_IMAGE_URL}/aura/back/${ITEM_IDS[NPCparts.aura]}.png`;
  const auraFront =
    NPCparts.aura &&
    `${CONFIG.PROTECTED_IMAGE_URL}/aura/front/${ITEM_IDS[NPCparts.aura]}.png`;

  return (
    <div>
      {auraBack && (
        <Spritesheet
          className="absolute w-full inset-0 pointer-events-none"
          style={{
            width: `${width}px`,
            top: `${width * -0.21}px`,
            imageRendering: "pixelated" as const,
          }}
          image={auraBack}
          widthFrame={AURA_WIDTH}
          heightFrame={FRAME_HEIGHT}
          zoomScale={new SpringValue(1)}
          steps={AURA_STEPS}
          fps={14}
          autoplay={true}
          loop={true}
        />
      )}
      <div
        className="w-full inset-0 pointer-events-none"
        style={{
          width: `${width}px`,
          imageRendering: "pixelated" as const,
        }}
      >
        <div
          className="relative"
          style={{ width: `${width}px`, height: `${width}px` }}
        >
          <img
            id="idle"
            src={idle}
            style={{ width: `${width}px` }}
            onLoad={() => setLoaded(true)}
          />
          {!loaded && (
            <img
              id="silhouette"
              src={silhouette}
              className="w-3/5 absolute top-1.5 left-1.5"
            />
          )}
        </div>
      </div>
      {auraFront && (
        <Spritesheet
          className="absolute w-full inset-0 pointer-events-none"
          style={{
            width: `${width}px`,
            top: `${width * 0.14}px`,
            imageRendering: "pixelated" as const,
          }}
          image={auraFront}
          widthFrame={AURA_WIDTH}
          heightFrame={FRAME_HEIGHT}
          zoomScale={new SpringValue(1)}
          steps={AURA_STEPS}
          fps={14}
          autoplay={true}
          loop={true}
        />
      )}
      {/* {!hideShadow && (
        <img
          src={shadow}
          style={{
            width: `${PIXEL_SCALE * 9}px`,
            top: `${PIXEL_SCALE * 11}px`,
            left: `${PIXEL_SCALE * 2.3}px`,
          }}
          className="absolute pointer-events-none"
        />
      )}
      {auraBack && (
        <Spritesheet
          className="absolute w-full inset-0 pointer-events-none"
          style={{
            width: `${PIXEL_SCALE * 14}px`,
            top: `${PIXEL_SCALE * -3}px`,
            imageRendering: "pixelated" as const,
          }}
          image={auraBack}
          widthFrame={AURA_WIDTH}
          heightFrame={FRAME_HEIGHT}
          zoomScale={new SpringValue(1)}
          steps={AURA_STEPS}
          fps={14}
          autoplay={true}
          loop={true}
        />
      )}
      <Spritesheet
        className="w-full inset-0 pointer-events-none"
        style={{
          width: `${PIXEL_SCALE * 14}px`,
          imageRendering: "pixelated" as const,
        }}
        image={idle}
        widthFrame={FRAME_WIDTH}
        heightFrame={FRAME_HEIGHT}
        zoomScale={new SpringValue(1)}
        steps={STEPS}
        fps={14}
        autoplay={true}
        loop={true}
      />
      {auraFront && (
        <Spritesheet
          className="absolute w-full inset-0 pointer-events-none"
          style={{
            width: `${PIXEL_SCALE * 14}px`,
            top: `${PIXEL_SCALE * 2}px`,
            imageRendering: "pixelated" as const,
          }}
          image={auraFront}
          widthFrame={AURA_WIDTH}
          heightFrame={FRAME_HEIGHT}
          zoomScale={new SpringValue(1)}
          steps={AURA_STEPS}
          fps={14}
          autoplay={true}
          loop={true}
        />
      )} */}
    </div>
  );
};

export const NPCFixed: React.FC<NPCProps & { width: number }> = ({
  parts,
  width,
}) => {
  const NPCparts = parts as Partial<NPCParts>;
  const idle = getAnimationUrl(NPCparts, "idle_small");
  const auraBack =
    NPCparts.aura &&
    `${CONFIG.PROTECTED_IMAGE_URL}/aura/back/${ITEM_IDS[NPCparts.aura]}.png`;
  const auraFront =
    NPCparts.aura &&
    `${CONFIG.PROTECTED_IMAGE_URL}/aura/front/${ITEM_IDS[NPCparts.aura]}.png`;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        imageRendering: "pixelated" as const,
        width: `${width}px`,
        height: `${width}px`,
      }}
    >
      {auraBack && (
        <img
          src={auraBack}
          className="block absolute"
          style={{
            transform: "scale(9)",
            top: `${PIXEL_SCALE * 6}px`,
            left: "400%",
          }}
        />
      )}
      <img
        src={idle}
        className="block absolute"
        style={{
          transform: "scale(9)",
          top: `${PIXEL_SCALE * 6}px`,
          left: "400%",
        }}
      />
      {auraFront && (
        <img
          src={auraFront}
          className="block absolute"
          style={{
            transform: "scale(9)",
            top: `${PIXEL_SCALE * 6}px`,
            left: "400%",
          }}
        />
      )}
    </div>
  );
};
