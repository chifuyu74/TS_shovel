import Slider from "@comp/Slider";
import { SliderContainer } from "@comp/SliderContainer";
import useGL from "@hooks/useGL";
import useTranslation from "@hooks/useTranslation";
import useRotation from "@hooks/useRotation";
import useResizeWindow from "@hooks/useResizeWindow";
import useScale from "@hooks/useScale";

import "./App.css";

function App() {
  useResizeWindow();

  const [translation, onChangeTranslation] = useTranslation();
  const [rotation, onChangeRotation] = useRotation();
  const [scale, onChangeScale] = useScale();
  useGL(translation, rotation, scale);

  return (
    <div className="App">
      <canvas id="canvas">
        Your browser doesn't appear to support the HTML5{" "}
        <code>&lt;canvas&gt;</code> element.
      </canvas>
      <SliderContainer>
        <Slider
          onSlide={onChangeTranslation}
          idOfX={"transX"}
          idOfY={"transY"}
          valueX={translation.transX}
          valueY={translation.transY}
        />
        <Slider
          onSlide={onChangeRotation}
          idOfX={"angle"}
          valueX={rotation.angle}
          hasY={false}
        />
        <Slider
          onSlide={onChangeScale}
          idOfX={"scaleX"}
          idOfY={"scaleY"}
          valueX={scale.scaleX}
          valueY={scale.scaleY}
        />
      </SliderContainer>
    </div>
  );
}

export default App;

