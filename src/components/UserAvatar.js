// Third party
import React from "react";
import { Spinner, Icon, Tooltip } from "@blueprintjs/core";

export default class UserAvatar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      found: false,
      avatar: null
    }
  }

  fetchUser() {
    if (this.state.avatar === null && typeof this.props.fetchUser === 'function') {
      this.props.fetchUser(this.props.user)
        .then((user) => {
          this.setState({
            avatar: user.avatar,
            tooltip: user.fullname,
            found: true
          });
        })
        .catch((err) => {
          console.error(err);
          this.setState({
            avatar: "",
            tooltip: "",
            found: false
          });
        });
    }
  }

  componentDidUpdate() {
    this.fetchUser();
  }

  componentDidMount() {
    this.fetchUser();
  }

  render() {
    return <div className="user-avatar">
      <Tooltip content={this.state.tooltip}>
        {this.state.avatar === null && (
          <Spinner size="40" />
        )}

        {this.state.avatar !== null && this.state.found && (
          <img src={this.state.avatar} />
        )}
        
        {this.state.avatar !== null && !this.state.found && (
          <Icon iconSize="40" icon="person" />
        )}
      </Tooltip>
    </div>
  }
}