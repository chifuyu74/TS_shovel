import React from "react";
import styled from "styled-components";

import { selectRange } from "@utils/selectRange";

const Container = styled.div`
  .slider-range {
    display: flex;
  }
`;

type SliderProps = {
  onSlide: (e: React.ChangeEvent<HTMLInputElement>) => void;

  valueX: number;
  nameOfX: string;

  valueY?: number;
  nameOfY?: string;
  hasY?: boolean;

  valueZ?: number;
  nameOfZ?: string;
  hasZ?: boolean;
};

function Slider({
  onSlide,
  valueX,
  nameOfX,

  valueY,
  nameOfY,
  hasY = true,

  valueZ,
  nameOfZ,
  hasZ = true,
}: SliderProps) {
  const [min, maxX, maxY, step] = selectRange(nameOfX);

  return (
    <Container id="uiContainer">
      <div id="ui">
        <div className="slider-range">
          <div>{nameOfX}</div>
          <input
            type="range"
            name={nameOfX}
            value={valueX}
            min={min}
            max={maxX}
            step={step}
            onChange={onSlide}
            placeholder="x"
          />
          <div>{valueX}</div>
        </div>
        {hasY && (
          <div className="slider-range">
            <div>{nameOfY}</div>
            <input
              type="range"
              name={nameOfY}
              value={valueY}
              min={min}
              max={maxY}
              step={step}
              onChange={onSlide}
              placeholder="y"
            />
            <div>{valueY}</div>
          </div>
        )}
        {hasZ && (
          <div className="slider-range">
            <div>{nameOfZ}</div>
            <input
              type="range"
              name={nameOfZ}
              value={valueZ}
              min={min}
              max={maxX}
              step={step}
              onChange={onSlide}
              placeholder="z"
            />
            <div>{valueZ}</div>
          </div>
        )}
      </div>
    </Container>
  );
}

export default Slider;
