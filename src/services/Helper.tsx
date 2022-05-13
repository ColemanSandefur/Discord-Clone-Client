import {SxProps} from "@mui/material";

export function stringToColor(string: string) {
  let hash = 0;
  let i;

  /* eslint-disable no-bitwise */
  for (i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }

  let color = '#';

  for (i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  /* eslint-enable no-bitwise */

  return color;
}

export function fontColor(color: string) {
  let num = parseInt(color.slice(1), 16);

  let b = num & 0xff;
  let g = (num >> 8) & 0xff;
  let r = (num >> 16) & 0xff;
  
  let luminance = (0.299 * r + 0.587 * g + 0.114 * b)/255;

  if (luminance > 0.5) {
    return "#000000";// bright background
  } else {
    return "#ffffff";// dark background
  }
}

export function stringAvatar(name: string) {
  let children = "X";
  if (name.length != 0) {
    let split = name.split(' ');
    
    if (split.length == 1) {
      children = split[0][0];
    } else {
      children = `${name.split(' ')[0][0]}${name.split(' ')[1][0]}`;
    }
  }
  let bgcolor = stringToColor(name);
  let fgcolor = fontColor(bgcolor);
  let style: SxProps = {
    bgcolor: bgcolor,
    color: fgcolor
  }
  return {
    sx: style,
    children: children,
  };
}
