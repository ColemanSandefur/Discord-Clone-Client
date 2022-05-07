import React, {MutableRefObject, useEffect, useRef, useState} from 'react';
//import "./Message.scss"
import logo from "../../logo.svg"
import plusIcon from "../../plus.svg"

type ChannelEntryData = {id?: string, backgroundImage?: string, selected?: boolean, onClick?: (event: MouseEvent, data: ChannelEntryData) => void};
export function ChannelEntry(data: ChannelEntryData) {
  let className = (data.selected?.valueOf() === true)? "Selected" : "";

  const onClick = (event: MouseEvent) => {
    if (data.onClick) {
      data.onClick(event, data);
    }
  }

  return (
    //@ts-ignore
    <div onClick={onClick} className={"ChannelEntry" + ` ${className}`} id={data.id} style={{backgroundImage: `url(${(data.backgroundImage ? data.backgroundImage : logo)})`}}>
    </div>
  )
}

export function ChannelCreator(data: {id?: string, image?: string}) {
  return (
    //@ts-ignore
    <div className="ChannelEntry CreateChannel" id={data.id} style={{backgroundImage: `url(${(data.image ? data.image : logo)})`}}>
    </div>
  )
}

function getChannels(numChannels: number) {
  let channels: {[key: number]: {selected: boolean}} = {};

  for (let i = 0; i < numChannels; i++) {
    channels[i] = {selected: false};
  }

  return channels;
}

export function SideBar() {
  console.log(logo);
  const [channels, setChannels] = useState(getChannels(20));

  const onClick = (_event: MouseEvent, channelEntry: ChannelEntryData) => {
    let newChannels: {[key: number]: {selected: boolean}} = {};

    Object.entries(channels).forEach(([keyStr, value]) => {
      let key = parseInt(keyStr);
      channels[key].selected = keyStr === channelEntry.id;
      newChannels[key] = value;
    })

    // calls a render to be queued
    setChannels(newChannels);
  }

  let elements = Object.entries(channels).map(([key, value]) => {
    return(<ChannelEntry key={"channel " + key}id={key + ""} selected={value.selected} onClick={onClick}/>);
  });

  elements.push(<ChannelCreator key={"channel addition"}image={plusIcon} />);

  return (
    <div className="SideBar">
      <div className="SideBarContent">
        {elements}
      </div>
    </div>
  )
}
