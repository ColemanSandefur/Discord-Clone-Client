import {ApolloProvider} from '@apollo/client';
import {createContext, Dispatch, SetStateAction, useState} from 'react';
import './App.css';
import {MessagePage} from './pages/message/Message';
import client from "./services/ApiClient";
import {Channel} from "./pages/message/SideBar";

export type ChannelHolder = {
  [key: string]: ChannelType 
};

export type ChannelType = Channel&{selected: boolean};

export type AuthData = {
  authToken?: string,
  loggedIn: boolean,
};

export const ChannelContext = createContext<{channels: ChannelHolder, setChannels: Dispatch<SetStateAction<ChannelHolder>>} | null>(null);
export const AuthContext = createContext<AuthData>({loggedIn: false});

function App() {
  const [channels, setChannels] = useState({});

  return (
    <ApolloProvider client={client}>
      <ChannelContext.Provider value={{channels: channels, setChannels: setChannels}}>
        <AuthContext.Provider value={{authToken: "92588CE8EA6948D89A99F40B025357CE", loggedIn:false}}>
          <MessagePage />
        </AuthContext.Provider>
      </ChannelContext.Provider>
    </ApolloProvider>
  );
}

export default App;
