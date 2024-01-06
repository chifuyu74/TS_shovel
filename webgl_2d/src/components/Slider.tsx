import React from "react";
import styled from "styled-components";

import { selectRange } from "@utils/selectRange";

const Container = styled.div`
  .slider-range {
    display: flex;
  }
`;

type SliderProps = {
  valueX: number;
  valueY?: number;
  idOfX: string;
  idOfY?: string;
  onSlide: (e: React.ChangeEvent<HTMLInputElement>) => void;
  hasY?: boolean;
};

function Slider({
  valueX,
  valueY,
  idOfX,
  idOfY,
  onSlide,
  hasY = true,
}: SliderProps) {
  const [min, maxX, maxY, step] = selectRange(idOfX);
  return (
    <Container id="uiContainer">
      <div id="ui">
        <div className="slider-range">
          <div>{idOfX}</div>
          <input
            type="range"
            id={idOfX}
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
            <div>{idOfY}</div>
            <input
              type="range"
              id={idOfY}
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
      </div>
    </Container>
  );
}

export default Slider;
