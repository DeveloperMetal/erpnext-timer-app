// @flow

import React from "react"

// flow types
import * as NavTypes from "./AppWithNavigation.flow";

// Thirdparty Components
import { Icon, Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from "@blueprintjs/core";
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
      activePath: "timesheet/tasks",
      menuCollapsed: true,
      menuItems: [
        {
          path: "expand",
          label: "Collapse",
          icon: <Icon icon="menu" iconSize={iconSize} />
        },
        {
          path: "timesheet",
          label: "Timesheet",
          icon: <Icon icon="calendar" iconSize={iconSize} />,
          items: [
            {
              path: "tasks",
              label: "Tasks",
              icon: <Icon icon="timeline-events" iconSize={iconSize} />,
            },
            {
              path: "new-task",
              label: "New Task",
              icon: <Icon icon="plus" iconSize={iconSize} />,
            },
          ]
        },
        { expand: true },
        {
          path: "settings",
          label: "Settings",
          icon: <Icon icon="cog" iconSize={iconSize} />,
        }
  
      ]
    }
  }

  onPathChange(path : string) {
    if ( path != "expand" ) {
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
        defaultPath="timesheet/tasks" 
        activePath={activePath}
        items={menuItems} 
        collapsed={this.state.menuCollapsed} 
        itemHeightHint={iconSize + 14} 
        onPathChange={onPathChange}
      />
      <div id='content'>
        { activePath === "timesheet/tasks" && ( <TaskPage nav={onPathChange} /> ) }
        { activePath === "timesheet" && ( <TimelinePage nav={onPathChange} /> ) }
        { activePath === "timesheet/new-task" && ( <AddTaskPage nav={onPathChange } /> ) }
        { activePath === "settings" && ( <SettingsPage nav={onPathChange } /> ) }
      </div>
    </div>
  }
}