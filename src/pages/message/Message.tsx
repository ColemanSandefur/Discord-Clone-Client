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
import {Controller, SubmitHandler, useForm} from 'react-hook-form';

type MessageHolder = {
  [key: string]: Message
}

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
  sendMessage(token: $authToken, channelId: $channelToken, message: $message) {
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

type SendMessageVars = {
  authToken: string,
  channelToken: string,
  message: string,
};

type SendMessageData = {
  sendMessage?: MessageRaw
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

const UPDATE_MESSAGE = gql`
mutation UpdateMessage($token: Uuid!, $messageToken: Uuid!, $message: String!) {
  updateMessage(token: $token, messageId: $messageToken, message:$message)
}
`

type UpdateMessageVars = {
  token: string,
  messageToken: string,
  message: string,
}

type UpdateMessageData = {
  updateMessage?: MessageRaw,
}

const DELETE_MESSAGE = gql`
mutation DeleteMessage($token: Uuid!, $messageToken: Uuid!) {
  deleteMessage(token: $token, messageId: $messageToken)
}
`

type DeleteMessageVars = {
  token: string,
  messageToken: string,
}

type DeleteMessageData = {
  deleteMessage?: string
}

export function Message(data: {message: Message, handlers?: {onDelete?: (messageId: string) => void}}) {
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
          <MenuItem disableGutters={true} onClick={() => {data.handlers?.onDelete?.(data.message.messageId);}}>
              <DeleteRoundedIcon />
          </MenuItem>
        </MenuList>
      </HoverMenu>
    </div>
  )
}

export function MessagePage() {
  let pageRef: React.MutableRefObject<null | HTMLDivElement> = useRef(null);
  let [messages, setMessages] = useState<{messages: MessageHolder, tokens: string[]}>({messages: {}, tokens: []});

  // Hold the rendered elements
  let [messageElements, setMessageElements] = useState<JSX.Element[]>([]);
  useEffect(() => {
    setMessageElements(messages.tokens.map((messageId) => {
      if (messages.messages[messageId]) {
        let message = messages.messages[messageId];
        return (<Message key={messageId} message={message} handlers={{onDelete:(messageToken) => {deleteMessage({variables: {token: authData.authToken + "", messageToken: messageToken}});}}}/>)
      }
      return <div key={messageId}></div>;
    }));
  }, [messages])

  let [channel, setChannel] = useState<string | undefined>(undefined);
  let {authData} = useContext(AuthContext)!;
  
  // called on channel load to get all messages in channel, see getMessage for post page load message gathering
  let [getMessages, {loading}] = useLazyQuery<GetMessagesData, GetMessagesVars>(
    GET_MESSAGES,
    {fetchPolicy: "no-cache"}
  );

  // called when a new message is sent to update the message list
  let [getMessage, {}] = useLazyQuery<GetMessageData, GetMessageVars>(GET_SINGLE_MESSAGE, {fetchPolicy: "no-cache"});

  let [updateMessage, {}] = useMutation<UpdateMessageData, UpdateMessageVars>(UPDATE_MESSAGE, {
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      if (data.updateMessage) {
        let message = messageFromRaw(data.updateMessage);

        setMessages({tokens: messages.tokens, messages: {...messages.messages, [message.messageId]: message}});
      }
    }
  })

  // when a message is sent from sendMessage it will automatically fetch the message from the server and update the message list
  // (you could update it locally without contacting the server but this is easier)
  let [sendMessage, {}] = useMutation<SendMessageData, SendMessageVars>(SEND_MESSAGE, {fetchPolicy: "no-cache", onCompleted: (data) => {
    if (data.sendMessage) {
      let messageRaw = data.sendMessage;
      let message = messageFromRaw(messageRaw);

      let newMessageTokens = messages.tokens.slice();
      newMessageTokens.push(message.messageId);
      setMessages({
        tokens: newMessageTokens,
        messages: {...messages.messages, [message.messageId]: message},
      });
    }
  }});

  let [deleteMessage, {}] = useMutation<DeleteMessageData, DeleteMessageVars>(DELETE_MESSAGE, {fetchPolicy: "no-cache", onCompleted: (data) => {
    if (data.deleteMessage) {
      let deletedMessageToken = data.deleteMessage;

      let newMessageTokens = messages.tokens.slice();
      let index = newMessageTokens.indexOf(deletedMessageToken);
      if (index > -1) {
        newMessageTokens.splice(index, 1);
      }

      let newMessages = {...messages.messages};
      delete newMessages[deletedMessageToken];
      setMessages({
        tokens: newMessageTokens,
        messages: newMessages,
      });
    }
  }})

  // update message list when the focused channel changes
  useEffect(() => {
    if (channel) {
      const {} = getMessages({
        onCompleted: (data) => {
          if (data.getChannel) {
            let newMessages = data.getChannel.messages.map((raw) => {return messageFromRaw(raw);});
            let messageTokens = newMessages.map((message) => {return message.messageId;});
            let messageMap: MessageHolder = {};

            newMessages.forEach((message) => {
              messageMap[message.messageId] = message;
            });
            
            setMessages({
              tokens: messageTokens,
              messages: messageMap,
            });
          }
        }, 
        variables: {channelToken: channel, authToken: authData.authToken + ""} }
      )
    }
  }, [channel]);

  // the content to be rendered
  let pageContent: JSX.Element | JSX.Element[] = messageElements;

  if (!channel) {
    pageContent = <Alert severity="info">Please select a channel</Alert>
  } else if (loading) {
    pageContent = <CircularProgress />
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
          {pageContent}
        </div>

        <TextBar onSubmit={onSumbit}/>

        <SignInDialog open={!authData.loggedIn} />
      </div>
    </div>
  )
}

type Inputs = {
  username: string,
  password: string,
}

export function SignInDialog(data: {open: boolean}) {
  let {authData, setAuthData} = useContext(AuthContext)!;
  const {handleSubmit, control} = useForm<Inputs>();
  const onSubmit: SubmitHandler<Inputs> = (data) => {
    signIn({variables: {username: data.username, password: data.password}});
  };

  // keep track if there was a failed login attempt so an alert can tell the user that they entered the wrong information
  let [failedLogin, setFailedLogin] = useState(false);

  let [signIn, {loading}] = useMutation<SignInData, SignInVars>(SIGN_IN, {fetchPolicy: "no-cache", onCompleted: (data) => {
    setFailedLogin(data.signIn === undefined)
    if (data.signIn) {
      setAuthData({...authData, authToken: data.signIn, loggedIn: true})
    }
  }});

  let content;

  if (loading) {
    content = (
      <DialogContent>
        <CircularProgress />
      </DialogContent>
    )
  } else {
    content = (
      <>
        <DialogContent>
          {failedLogin &&
            <Alert severity="error" style={{visibility: (failedLogin)? "visible" : "hidden"}}>Wrong username or password</Alert>
          }
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="username"
              control={control}
              defaultValue={""}
              rules={{required: true}}
              render={({field}) => 
                <TextField {...field} inputRef={field.ref} margin="dense" fullWidth label={field.name} required/>} 
            />

            <Controller
              name="password"
              control={control}
              defaultValue={""}
              rules={{required: true}}
              render={({field}) => 
                <TextField {...field} inputRef={field.ref} margin="dense" fullWidth label={field.name} type="password" required />} 
            />
            <input type="submit" style={{display: "none"}} />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmit(onSubmit)}>Sign In</Button>
        </DialogActions>
      </>
    );
  }

  return (
    <Dialog open={data.open} fullWidth>
      <DialogTitle>Sign In</DialogTitle>
      {content}
    </Dialog>
  )
}
