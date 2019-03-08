// Third party components
import React from "react";
import { ButtonGroup, Button, Popover, Menu, MenuItem, Intent } from "@blueprintjs/core";

export default function TaskCommonActionsMenu(props) {
  const { timesheet_id, task_id, onOpenBrowser, buttonProps } = props;

  const contextMenu = <Menu>
    { timesheet_id && (
      <MenuItem 
        icon="time" 
        text="Open Timesheet on browser"
        onClick={() => onOpenBrowser?onOpenBrowser(`Doctype://Form/Timesheet/${timesheet_id}`):'' }
      />
    )}
    { task_id && (
      <MenuItem 
        icon="annotation" 
        text="Open Task on browser"
        onClick={() => onOpenBrowser?onOpenBrowser(`Doctype://Form/Task/${task_id}`):''}
      />
    )}
    { props.children &&  ( <Menu.Divider /> ) }
    { props.children }
  </Menu>;
  
  return (
    <Popover 
      content={contextMenu} 
      className="bp3-dark"
      lazy={true}
      usePortal={true}
      hasBackdrop={true}
    >
      <Button intent={props.intent || Intent.NONE}  icon={ props.icon || "cog" } {...buttonProps}/>
    </Popover>
  )
}