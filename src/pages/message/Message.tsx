import {gql, useLazyQuery, useMutation} from '@apollo/client';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {isMobile} from 'react-device-detect';
import {AuthContext} from '../../App';
import "./Message.scss"
import {SideBar} from './SideBar';
import {TextBar} from './TextBar';

const GET_MESSAGES = gql`
query GetMessages($authToken: Uuid!, $channelToken: Uuid!) {
  getChannel(token: $authToken, channelId: $channelToken) {
    messages {
      messageId,
      message,
      userId,
      channelId,
    }
  }
}
`

export function Message(data: {text: string, id?:string}) {
  return (<div className="Message" id={data.id}>{data.text}</div>)
}

type GetMessagesVars = {
  authToken: string,
  channelToken: string,
}

type GetMessagesData = {
  getChannel?: {
    messages: Message[]
  }
}

type Message = {
  messageId: string,
  message: string,
  userId: string,
  channelId: string,
}

const SEND_MESSAGE = gql`
mutation SendMessage($authToken: Uuid!, $channelToken: Uuid!, $message: String!) {
  sendMessage(token: $authToken, channelId: $channelToken, message: $message)
}
`

type SendMessageVars = {
  authToken: string,
  channelToken: string,
  message: string,
};

type SendMessageData = {
  sendMessage?: string
}

export function MessagePage() {
  let pageRef: React.MutableRefObject<null | HTMLDivElement> = useRef(null);
  let [messages, setMessages] = useState<Message[]>([]);
  let [channel, setChannel] = useState<string | undefined>(undefined);
  let authData = useContext(AuthContext);
  let [getMessages, {loading}] = useLazyQuery<GetMessagesData, GetMessagesVars>(
    GET_MESSAGES,
    {fetchPolicy: "no-cache"}
  );
  let [sendMessage, {}] = useMutation<SendMessageData, SendMessageVars>(SEND_MESSAGE, {fetchPolicy: "no-cache"});

  useEffect(() => {
    if (channel) {
      const {} = getMessages({
        onCompleted: (data) => {
          if (data.getChannel) {
            setMessages(data.getChannel.messages);
          }
        }, 
        variables: {channelToken: channel, authToken: authData.authToken + ""} }
      )
    }
  }, [channel]);

  let messageElements: JSX.Element | JSX.Element[] = [];

  if (loading) {
    messageElements = <Message key="Loading" text="Loading" />
  } else if (!channel) {
    messageElements = <Message key="SelectMessage" text="Please Select a Channel" />
  } else {
    messageElements = messages.map((message) => {
      return (<Message key={message.messageId} text={message.message} />)
    });
  }

  // a dumb workaround for mobile users
  const resize = () => {
    if (isMobile) {
      let current = pageRef.current;
      if (current) {
        current.style.height = window.innerHeight + "px";
      }
    }
  }

  const onSumbit = (text: string) => {
    alert(text);
    if (authData.authToken && channel && text.length > 0) {
      sendMessage({variables: {authToken: authData.authToken, channelToken: channel, message: text}})
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
      <SideBar onClick={(id) => {setChannel(id)}} />
      <div className="MessageContent">
        <div className="MessageList">
          {messageElements}
        </div>

        <TextBar onSubmit={onSumbit}/>
      </div>
    </div>
  )
}
