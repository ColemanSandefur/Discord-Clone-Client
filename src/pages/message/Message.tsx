import {gql, useLazyQuery, useMutation} from '@apollo/client';
import {Alert, Avatar, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, MenuList, TextField} from '@mui/material';
import Button from '@mui/material/Button';
import React, {useContext, useEffect, useRef, useState} from 'react';
import {isMobile} from 'react-device-detect';
import {AuthContext} from '../../App';
import "./Message.scss"
import {SideBar} from './SideBar';
import {TextBar} from './TextBar';
import HoverMenu from "material-ui-popup-state/HoverMenu";
import {bindHover, bindMenu, usePopupState} from "material-ui-popup-state/hooks";
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import {stringAvatar} from '../../services/Helper';

const GET_MESSAGES = gql`
query GetMessages($authToken: Uuid!, $channelToken: Uuid!) {
  getChannel(token: $authToken, channelId: $channelToken) {
    messages {
      messageId,
      message,
      userId,
      channelId,
      timestamp,
      author {
        username
      }
    }
  }
}
`

type GetMessagesVars = {
  authToken: string,
  channelToken: string,
}

type GetMessagesData = {
  getChannel?: {
    messages: MessageRaw[]
  }
}

type MessageRaw = {
  messageId: string,
  message: string,
  userId: string,
  channelId: string,
  timestamp: string,
  author: Author
}

type Author = {
  username: string
}

function messageFromRaw(raw: MessageRaw): Message {
  return {
    ...raw,
    timestamp: new Date(raw.timestamp),
  }
}

type Message = {
  messageId: string,
  message: string,
  userId: string,
  channelId: string,
  timestamp: Date,
  author: Author
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

const GET_SINGLE_MESSAGE = gql`
query GetSingleMessage($authToken: Uuid!, $messageToken: Uuid!) {
  getMessage(token: $authToken, messageId: $messageToken) {
    messageId,
    message,
    userId,
    channelId,
    timestamp,
    author {
      username
    }
  }
}
`

type GetMessageVars = {
  authToken: string,
  messageToken: string,
}

type GetMessageData = {
  getMessage?: MessageRaw,
}

const SIGN_IN = gql`
mutation SignIn($username: String!, $password: String!) {
  signIn(username: $username, password: $password)
}
`

type SignInVars = {
  username: string,
  password: string,
}

type SignInData = {
  signIn?: string
}

export function Message(data: {message: Message}) {
  const anchorEl = useRef<HTMLDivElement | null>(null);
  
  const popupState = usePopupState({variant: "popover", popupId: "test"});

  const name = data.message.author.username; 
  const has_avatar = false;

  // set avatar to either an image, or a color
  let content = (has_avatar) ? {src: "avatar link"} : stringAvatar(name);

  return (
    <div className="Message" id={data.message.messageId} {...bindHover(popupState)}>
      <Avatar variant="circular" alt={name} {...content} className="avatar"></Avatar>
      <div className="content" ref={anchorEl}>
        <h1 className="username">{name}</h1>
        <span className="message">
          {data.message.message}
        </span>
      </div>
      <HoverMenu className="MessageMenu" {...bindMenu(popupState)} anchorOrigin={{vertical: 'top', horizontal: 'right'}} transformOrigin={{vertical: 'bottom', horizontal: 'right'}}>
        <MenuList className="MessageMenu" dense={true} style={{flexDirection: 'row', display: 'flex', padding: 0}}>
          <MenuItem disableGutters={true}>
              <EditRoundedIcon />
          </MenuItem>
          <MenuItem disableGutters={true}>
              <DeleteRoundedIcon />
          </MenuItem>
        </MenuList>
      </HoverMenu>
    </div>
  )
}

export function MessagePage() {
  let pageRef: React.MutableRefObject<null | HTMLDivElement> = useRef(null);
  let [messages, setMessages] = useState<Message[]>([]);
  let [channel, setChannel] = useState<string | undefined>(undefined);
  let {authData} = useContext(AuthContext)!;
  
  // called on channel load to get all messages in channel, see getMessage for post page load message gathering
  let [getMessages, {loading}] = useLazyQuery<GetMessagesData, GetMessagesVars>(
    GET_MESSAGES,
    {fetchPolicy: "no-cache"}
  );

  // called when a new message is sent to update the message list
  let [getMessage, {}] = useLazyQuery<GetMessageData, GetMessageVars>(GET_SINGLE_MESSAGE, {fetchPolicy: "no-cache"});


  // when a message is sent from sendMessage it will automatically fetch the message from the server and update the message list
  // (you could update it locally without contacting the server but this is easier)
  let [sendMessage, {}] = useMutation<SendMessageData, SendMessageVars>(SEND_MESSAGE, {fetchPolicy: "no-cache", onCompleted: (data) => {
    if (data.sendMessage) {
      let messageId = data.sendMessage;

      getMessage({variables: {authToken: authData.authToken + "", messageToken: messageId}, onCompleted: (message_data) => {
        if (message_data.getMessage) {
          let new_messages = messages.slice();
          new_messages.push(messageFromRaw(message_data.getMessage));
          setMessages(new_messages);
        }
      }, onError: (error) => console.error(error)});
    }
  }});

  // update message list when the focused channel changes
  useEffect(() => {
    if (channel) {
      const {} = getMessages({
        onCompleted: (data) => {
          if (data.getChannel) {
            let messages = data.getChannel.messages.map((raw) => {return messageFromRaw(raw);});
            setMessages(messages);
          }
        }, 
        variables: {channelToken: channel, authToken: authData.authToken + ""} }
      )
    }
  }, [channel]);

  // the content to be rendered
  let messageElements: JSX.Element | JSX.Element[] = [];

  if (!channel) {
    messageElements = <Alert severity="info">Please select a channel</Alert>
  } else if (loading) {
    messageElements = <CircularProgress />
  } else {
    messageElements = messages.map((message) => {
      return (<Message key={message.messageId} message={message} />)
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

  // given to textbar to send message to server
  const onSumbit = (text: string) => {
    if (authData.authToken && channel && text.length > 0) {
      sendMessage({variables: {authToken: authData.authToken, channelToken: channel, message: text}})
    }
  }

  // set up listeners for resizing textbar
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
      <SideBar setChannelToken={(id) => {setChannel(id)}} selectedChannelToken={channel} />
      <div className="MessageContent">
        <div className="MessageList">
          {messageElements}
        </div>

        <TextBar onSubmit={onSumbit}/>

        <SignInDialog open={!authData.loggedIn} />
      </div>
    </div>
  )
}

export function SignInDialog(data: {open: boolean}) {
  let {authData, setAuthData} = useContext(AuthContext)!;

  let username = useRef<HTMLInputElement>(null);
  let password = useRef<HTMLInputElement>(null);
  let submitButton = useRef<HTMLButtonElement>(null);
  let [failedLogin, setFailedLogin] = useState(false);

  let [signIn, {}] = useMutation<SignInData, SignInVars>(SIGN_IN, {fetchPolicy: "no-cache", onCompleted: (data) => {
    if (data.signIn) {
      setAuthData({...authData, authToken: data.signIn, loggedIn: true})
      setFailedLogin(false);
    } else {
      setFailedLogin(true);
    }
  }});

  const handleSignIn = () => {
    if (username.current && password.current) {
      signIn({variables: {username: username.current.value, password: password.current.value}});
    }
  }

  return (
    <Dialog open={data.open}>
      <DialogTitle>Sign In</DialogTitle>
      <DialogContent>
        {failedLogin &&
          <Alert severity="error" style={{visibility: (failedLogin)? "visible" : "hidden"}}>Wrong username or password</Alert>
        }
        <form onSubmit={(event) => {event.preventDefault(); handleSignIn();}}>
          <TextField inputRef={username} margin="dense" id="username" label="username" fullWidth />
          <TextField inputRef={password} margin="dense" id="password" label="password" fullWidth type="password"/>
          <input type="submit" style={{display: "none"}} />
        </form>
      </DialogContent>
      <DialogActions>
        <Button ref={submitButton} onClick={handleSignIn}>Sign In</Button>
      </DialogActions>
    </Dialog>
  )
}
