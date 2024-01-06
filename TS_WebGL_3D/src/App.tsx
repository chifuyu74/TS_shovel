import Slider from "@comp/Slider";
import { SliderContainer } from "@comp/SliderContainer";
import { useGL3D } from "@hooks/useGL";
import { useTranslation3D } from "@/hooks/useTranslation";
import { useRotation3D } from "@hooks/useRotation";
import useResizeWindow from "@hooks/useResizeWindow";
import { useScale3D } from "@hooks/useScale";
import { useFieldOfView } from "@/hooks/useFieldOfView";
import { useCameraAngle } from "@hooks/useCameraAngle";
import { useLightRotation2D } from "@hooks/useLightRotation";
import { useLimit } from "@hooks/useLimit";

import "./App.css";

function App() {
  useResizeWindow();

  // const [translation, onChangeTranslation] = useTranslation3D();
  // const [rotation, onChangeRotation] = useRotation3D();
  // const [scale, onChangeScale] = useScale3D();
  // const [fieldOfView, onChangeFieldOfView] = useFieldOfView();
  const [cameraAngle, onChangeCameraAngle] = useCameraAngle();
  const [lightAngle, onChangeLightAngle] = useLightRotation2D();
  const [limit, onChangeLimit] = useLimit();
  useGL3D(cameraAngle, lightAngle, limit);

  // const { transX, transY, transZ } = translation;
  // const { rotX, rotY, rotZ } = rotation;
  // const { scaleX, scaleY, scaleZ } = scale;
  // const { fov } = fieldOfView;

  return (
    <div className="App">
      <canvas id="canvas">
        Your browser doesn't appear to support the HTML5 <code>&lt;canvas&gt;</code> element.
      </canvas>
      <SliderContainer>
        <Slider
          onSlide={onChangeCameraAngle}
          nameOfX="cameraAngle"
          valueX={cameraAngle.cameraAngle}
          hasY={false}
          hasZ={false}
        />
        <Slider
          onSlide={onChangeLightAngle}
          nameOfX={"lightX"}
          valueX={lightAngle.x}
          nameOfY={"lightY"}
          valueY={lightAngle.y}
          hasZ={false}
        />
        <Slider
          onSlide={onChangeLimit}
          nameOfX={"innerLimit"}
          valueX={limit.innerLimit}
          nameOfY={"outerLimit"}
          valueY={limit.outerLimit}
          hasZ={false}
        />
        {/* <Slider
          onSlide={onChangeFieldOfView}
          nameOfX={"fov"}
          valueX={fov}
          hasY={false}
          hasZ={false}
        />
        <Slider
          onSlide={onChangeTranslation}
          nameOfX={"transX"}
          valueX={transX}
          nameOfY={"transY"}
          valueY={transY}
          nameOfZ={"transZ"}
          valueZ={transZ}
        />
        <Slider
          onSlide={onChangeRotation}
          nameOfX={"rotX"}
          valueX={rotX}
          nameOfY={"rotY"}
          valueY={rotY}
          nameOfZ={"rotZ"}
          valueZ={rotZ}
        />
        <Slider
          onSlide={onChangeScale}
          nameOfX={"scaleX"}
          valueX={scaleX}
          nameOfY={"scaleY"}
          valueY={scaleY}
          nameOfZ={"scaleZ"}
          valueZ={scaleZ}
        /> */}
      </SliderContainer>
    </div>
  );
}

export default App;
