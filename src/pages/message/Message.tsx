import React, {useEffect, useRef} from 'react';
import {isMobile} from 'react-device-detect';
import "./Message.scss"
import {SideBar} from './SideBar';
import {TextBar} from './TextBar';

export function Message(data: {text: string, id?:string}) {
  return (<div className="Message" id={data.id}>{data.text}</div>)
}

function repeat(arr: any[], times: number) {
  let newArray: any[] = [];

  for (let i = 0; i < times; i++) {
    arr.forEach((val) => {
      newArray.push(val);
    });
  }

  return newArray;
}

export function MessagePage() {
  let strMessages = ["Hi", "how are you", "this is fine", "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.", "pellentesque pulvinar pellentesque habitant morbi", "neque egestas congue quisque egestas diam in arcu cursus euismod quis viverra nibh cras pulvinar mattis nunc sed blandit libero volutpat sed cras ornare arcu", "quis blandit turpis cursus in hac habitasse platea dictumst quisque sagittis purus sit amet volutpat consequat mauris nunc congue nisi vitae suscipit tellus mauris a diam maecenas sed enim ut sem viverra aliquet eget sit amet tellus cras adipiscing enim eu turpis egestas pretium aenean pharetra magna ac placerat vestibulum"];
  let pageRef: React.MutableRefObject<null | HTMLDivElement> = useRef(null);

  let messages = repeat(
    strMessages.map((val, idx) => {return (<Message text={val} id={idx + ""} />)}),
    10
  );

  // a dumb workaround for mobile users
  const resize = () => {
    if (isMobile) {
      let current = pageRef.current;
      if (current) {
        current.style.height = window.innerHeight + "px";
      }
    }
  }

  useEffect(() => {
    window.addEventListener('resize', () => resize());
    window.addEventListener("load", () => resize());
    return () => {
      window.removeEventListener('resize', () => resize());
      window.removeEventListener("load", () => resize());
    };
  }, []);

  return (
    <div className="MessagePage" ref={pageRef}>
      <SideBar />
      <div className="MessageContent">
        <div className="MessageList">
          {messages}
        </div>

        <TextBar />
      </div>
    </div>
  )
}
