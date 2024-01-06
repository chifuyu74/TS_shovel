import styled from "styled-components";

export const SliderContainer = styled.div`
  & {
    width: 200px;
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 3;

    .slider-range {
      display: flex;
    }
  }
`;
