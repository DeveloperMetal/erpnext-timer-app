// @flow

import React from "react"

// flow types
import * as NavTypes from "./AppWithNavigation.flow";

// Thirdparty Components
import { Icon, Tooltip, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from "@blueprintjs/core";
import VerticalNav from "bloom-nav-column";

// Components
import TaskPage from "./Tasks";
import TimelinePage from "./TimelinePage";
import AddTaskPage from "./AddTaskPage";
import SettingsPage from "./SettingsPage";

const iconSize : number = 24;

export default class extends React.PureComponent<NavTypes.Props, NavTypes.State> {

  constructor(props : NavTypes.Props) {
    super(props)

    this.state = {
      activePath: "tasks",
      menuCollapsed: true,
      menuItems: [
        {
          path: "expand",
          label: "Collapse",
          icon: <Tooltip content="Expand/Collapse navigation labels"><Icon icon="menu" iconSize={iconSize} /></Tooltip>
        },
        {
          path: "timesheet",
          label: "Timesheet",
          icon: <Tooltip content="View timesheet timeline"><Icon icon="calendar" iconSize={iconSize} /></Tooltip>,
        },
        {
          path: "tasks",
          label: "Tasks",
          icon: <Tooltip content="View tasks and start/stop timer."><Icon icon="time" iconSize={iconSize} /></Tooltip>,
          items: [
            {
              path: "new-task",
              label: "New Task",
              icon: <Tooltip content="Create a new task. (Note that a project must exist on the server to use this feature)"><Icon icon="plus" iconSize={iconSize} /></Tooltip>,
            },
          ]
        },
        { expand: true },
        {
          path: "settings",
          label: "Settings",
          icon: <Tooltip content="App Settings"><Icon icon="cog" iconSize={iconSize} /></Tooltip>,
        }
  
      ]
    }
  }

  onPathChange(path : string) {
    if ( path !== "expand" ) {
      if ( path ) {
        this.setState({
          activePath: path
        })
      }
    } else {
      let menuItems : Array<NavTypes.MenuItems> = this.state.menuItems.slice(0);
      let menuCollapsed : boolean = !this.state.menuCollapsed;
      menuItems[0].rightIcon = <Icon icon={menuCollapsed?"caret-right":"caret-left"} />;
      this.setState({
        menuItems,
        menuCollapsed
      });
    }
  }

  render() {
    const { menuItems, activePath } = this.state;
    const onPathChange = (path : string) => this.onPathChange(path);

    return <div id='app' className='bloom'>
      <VerticalNav
        defaultPath="tasks" 
        activePath={activePath}
        items={menuItems} 
        collapsed={this.state.menuCollapsed} 
        itemHeightHint={iconSize + 14} 
        onPathChange={onPathChange}
      />
      <div id='content'>
        { activePath === "tasks" && ( <TaskPage nav={onPathChange} /> ) }
        { activePath === "timesheet" && ( <TimelinePage nav={onPathChange} /> ) }
        { activePath === "tasks/new-task" && ( <AddTaskPage nav={onPathChange } /> ) }
        { activePath === "settings" && ( <SettingsPage nav={onPathChange } /> ) }
      </div>
    </div>
  }
}