import {gql, useLazyQuery, useMutation} from '@apollo/client';
import {Avatar, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Tooltip} from '@mui/material';
import {useContext, useState} from 'react';
import {Controller, SubmitHandler, useForm} from 'react-hook-form';
import {AuthContext, ChannelContext, ChannelType} from '../../App';
import logo from "../../logo.svg"
import plusIcon from "../../plus.svg"
import {Channel} from './SideBar';

const CREATE_CHANNEL = gql`
mutation CreateChannel($authToken: Uuid!, $channelName: String!) {
  createChannel(token: $authToken, channelName: $channelName) {
    id,
    name
  }
}
`

type CreateChannelVars = {
  authToken: string,
  channelName: string,
};

type CreateChannelData = {
  createChannel?: Channel
}

type ChannelInputs = {
  name: string
};

export function ChannelCreator() {
  let {authData} = useContext(AuthContext)!;
  const {handleSubmit, control, reset} = useForm<ChannelInputs>();
  let [open, setOpen] = useState(false);
  const channelContext = useContext(ChannelContext);

  const [createChannel] = useMutation<CreateChannelData, CreateChannelVars>(CREATE_CHANNEL, 
    {
      onCompleted: (data) => {
        if (data.createChannel && channelContext) {
          let newChannel: ChannelType = {selected: false, ...data.createChannel};
          
          let {channels, setChannels} = channelContext;

          setChannels({...channels, [newChannel.id]: newChannel});
        }
      },
      onError: (error) => {
        console.log(error);
      },
      fetchPolicy: "no-cache"
    }
  );

  const onSubmit: SubmitHandler<ChannelInputs> = (data) => {
    createChannel({variables: {authToken: authData.authToken + "", channelName: data.name}});
    closeMenu();
  };

  const closeMenu = () => {
    setOpen(false);
    reset();
  }

  return (
    <>
      <ChannelCreatorButton key={"channel addition"}image={plusIcon} onClick={() => {setOpen(true)}}/>
      <Dialog
        open={open}
        onClose={closeMenu}
      >
        <DialogTitle>
          {"Create a channel"}
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller
              name="name"
              control={control}
              defaultValue={""}
              rules={{required: true}}
              render={({field}) => 
                <TextField {...field} inputRef={field.ref} margin="dense" fullWidth label={field.name} required/>} 
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeMenu}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)}>Create</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export function ChannelCreatorButton(data: {id?: string, image?: string, onClick?: () => void}) {
  return (
    <Tooltip title="Create Channel" placement="right" arrow>
      <Avatar src={(data.image ? data.image : logo)} className="ChannelEntry CreateChannel" onClick={data.onClick}>
      </Avatar>
    </Tooltip>
  )
}
