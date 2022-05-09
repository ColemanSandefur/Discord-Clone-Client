import {MutableRefObject, useEffect, useRef} from "react"
import {isMobile} from "react-device-detect";
import plusIcon from "../../add-free-icon-font.svg"
import smileIcon from "../../smile-free-icon-font.svg"

function BarButton(data: {image?: string, onClick?: () => void}) {
  return (
    <div className="BarButton" onClick={data.onClick}>
      <img src={`${data.image + ""}`}/>
    </div>
  )
}

export function TextBar(data: {onSubmit?: (text: string) => void}) {
  let textArea: MutableRefObject<null | HTMLTextAreaElement> = useRef(null);

  const updateHeight = (textArea: HTMLTextAreaElement) => {
    let computed = getComputedStyle(textArea);
    let borderWidth = parseFloat(computed.borderTopWidth);
    textArea.style.height = "0px";
    textArea.style.height = (textArea.scrollHeight + borderWidth * 2) + "px";
  }

  const onKeyUp = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    let textArea = event.currentTarget;

    updateHeight(textArea);
  }

  // Prevent adding a new line unless shift is being held during key press
  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    
    if (!isMobile && event.key == "Enter" && !event.shiftKey) {
      if (data.onSubmit) {
        data.onSubmit(event.currentTarget.value + "");
      }
      event.currentTarget.value = "";
      updateHeight(event.currentTarget);
      event.preventDefault();
    }
  }

  useEffect(() => {
    // Update height on mount
    if (textArea.current) {
      updateHeight(textArea.current);
    }

    // on unmount
    return () => {
    };
  }, []);

  return (
    <div className="MessageBar" >
      <div className="Bar">
        <BarButton image={plusIcon} onClick={() => {}} />
        <div className="TextareaWrapper">

        <textarea ref={textArea} id="" name="" rows={1} onKeyUp={onKeyUp} onKeyDown={onKeyDown}></textarea>
        </div>
        <BarButton image={smileIcon} />
      </div>
    </div>
  )
}
export {}
