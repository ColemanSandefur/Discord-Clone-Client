import {gql, useLazyQuery, useQuery} from '@apollo/client';
import {Avatar, Tooltip} from '@mui/material';
import {useContext, useEffect} from 'react';
import {AuthContext, ChannelContext, ChannelHolder, ChannelType} from '../../App';
import logo from "../../logo.svg"
import plusIcon from "../../plus.svg"
import {ChannelCreator} from './CreateChannel';

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

type ChannelEntryData = {channel: ChannelType, backgroundImage?: string, onClick?: (event: React.MouseEvent<HTMLDivElement>, data: ChannelEntryData) => void};
export function ChannelEntry(data: ChannelEntryData) {
  let className = (data.channel.selected === true)? "Selected" : "";

  const onClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (data.onClick) {
      data.onClick(event, data);
    }
  }

  return (
    <Tooltip title={data.channel.name} placement="right" arrow>
      <Avatar onClick={onClick} alt={data.channel.name} src={data.backgroundImage ? data.backgroundImage : logo} className={"ChannelEntry" + ` ${className}`}>
      </Avatar>
    </Tooltip>
  )
}


export function SideBar(data: {setChannelToken?: (token: string) => void, selectedChannelToken: string | undefined}) {
  const channelContext = useContext(ChannelContext);
  const {authData} = useContext(AuthContext)!;
  const [getChannels, {loading}] = useLazyQuery<GetChannelsData, GetChannelsVars>(GET_CHANNELS, 
    {
      onCompleted: (data) => {
        let newChannels: ChannelHolder = {};

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
      },
      fetchPolicy: "no-cache"
    }
  );

  useEffect(() => {
    if (authData.authToken) {
      getChannels({
        variables: {authToken: authData.authToken}, 
      });
    }
  }, [authData])

  let elements: JSX.Element[] = [];

  // generate channels if they exist
  if (!loading && channelContext) {
    const {channels, setChannels} = channelContext;

    const onClick = (_event: React.MouseEvent, channelEntry: ChannelEntryData) => {
      let newChannels: ChannelHolder = {...channels};

      if (data.selectedChannelToken) {
        newChannels[data.selectedChannelToken].selected = false;
      }
      newChannels[channelEntry.channel.id].selected = true;

      // calls a render to be queued
      setChannels(newChannels);

      if (data.setChannelToken) {
        data.setChannelToken(channelEntry.channel.id + "");
      }
    }

    elements = Object.entries(channels).map(([key, value]) => {
      return(<ChannelEntry key={"channel " + key} channel={value} onClick={onClick}/>);
    });
  }

  elements.push(<ChannelCreator key={"channel creator"}/>);

  return (
    <div className="SideBar">
      <div className="SideBarContent">
        {elements}
      </div>
    </div>
  )
}
