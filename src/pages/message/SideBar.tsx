import {gql, useQuery} from '@apollo/client';
import {useContext} from 'react';
import {AuthContext, ChannelContext, ChannelType} from '../../App';
import logo from "../../logo.svg"
import plusIcon from "../../plus.svg"

const GET_CHANNELS = gql`
query GetChannels($authToken: Uuid!) {
  channels(token: $authToken) {
    id,
    name
  }
}
`

type GetChannelsVars = {
  authToken: string
}

type GetChannelsData = {
  channels: Channel[]
}

export type Channel = {
  id: string,
  name: string,
}

type ChannelEntryData = {id?: string, backgroundImage?: string, selected?: boolean, onClick?: (event: React.MouseEvent<HTMLDivElement>, data: ChannelEntryData) => void};
export function ChannelEntry(data: ChannelEntryData) {
  let className = (data.selected?.valueOf() === true)? "Selected" : "";

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (data.onClick) {
      data.onClick(event, data);
    }
  }

  return (
    <div onClick={onClick} className={"ChannelEntry" + ` ${className}`} id={data.id} style={{backgroundImage: `url(${(data.backgroundImage ? data.backgroundImage : logo)})`}}>
    </div>
  )
}

export function ChannelCreator(data: {id?: string, image?: string}) {
  return (
    <div className="ChannelEntry CreateChannel" id={data.id} style={{backgroundImage: `url(${(data.image ? data.image : logo)})`}}>
    </div>
  )
}

export function SideBar(data: {onClick?: (id: string) => void}) {
  const channelContext = useContext(ChannelContext);
  const authData = useContext(AuthContext);
  const {loading} = useQuery<GetChannelsData, GetChannelsVars>(GET_CHANNELS, 
    {
      variables: {authToken: authData.authToken + ""}, 
      onCompleted: (data) => {
        let newChannels: ChannelType = {};

        data.channels.forEach((channel) => {
          newChannels[channel.id] = {selected: false, ...channel};
        });

        if (channelContext) {
          const {setChannels} = channelContext;
          setChannels(newChannels);
        }
      },
      onError: (error) => {
        console.log(error);
      }
    }
  );

  let elements: JSX.Element[] = [];

  // generate channels if they exist
  if (!loading && channelContext) {
    const {channels, setChannels} = channelContext;


    const onClick = (_event: React.MouseEvent, channelEntry: ChannelEntryData) => {
      let newChannels: ChannelType = {};

      Object.entries(channels).forEach(([keyStr, value]) => {
        let key = parseInt(keyStr);
        newChannels[key] = value;
        newChannels[key].selected = keyStr === channelEntry.id;
      })

      // calls a render to be queued
      setChannels(newChannels);

      if (data.onClick) {
        data.onClick(channelEntry.id + "");
      }
    }

    elements = Object.entries(channels).map(([key, value]) => {
      return(<ChannelEntry key={"channel " + key}id={key + ""} selected={value.selected} onClick={onClick}/>);
    });
  }

  elements.push(<ChannelCreator key={"channel addition"}image={plusIcon} />);

  return (
    <div className="SideBar">
      <div className="SideBarContent">
        {elements}
      </div>
    </div>
  )
}
