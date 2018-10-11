import * as DataTypes from "../connectors/Data.flow";
import type Moment from "moment";

export type TaskListProps = {
  backend : DataTypes.State
}

export type TaskListState = {
  
}

export type TaskListItemProps = {
  activities : DataTypes.Activity[]
}

export type TaskListItemState = {
  from_time : ?Moment,
  to_time : ?Moment
}