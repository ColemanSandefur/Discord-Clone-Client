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
export const AuthContext = createContext<{authData: AuthData, setAuthData: Dispatch<SetStateAction<AuthData>>} | null>(null);

function App() {
  const [channels, setChannels] = useState({});
  const [authData, setAuthData] = useState<AuthData>({loggedIn: false});

  return (
    <ApolloProvider client={client}>
      <ChannelContext.Provider value={{channels: channels, setChannels: setChannels}}>
        <AuthContext.Provider value={{authData: authData, setAuthData: setAuthData}}>
          <MessagePage />
        </AuthContext.Provider>
      </ChannelContext.Provider>
    </ApolloProvider>
  );
}

export default App;
