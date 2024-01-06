import styled from "styled-components";

export const SliderContainer = styled.div`
  & {
    width: 200px;
    position: fixed;
    top: 10px;
    right: 100px;
    z-index: 3;

    .slider-range {
      display: flex;
    }
  }
`;
