// Third party
import React from "react";
import { Spinner, Icon, Tooltip } from "@blueprintjs/core";

const userCache = {};

export default class UserAvatar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      avatar: null,
      hasAvatar: null,
      user: this.props.user
    }

    this._mounted = false;

    if ( typeof this.props.fetchUser !== 'function' ) {
      throw new Error("fetchUser should be a function");
    }
  }

  fetchUser() {
    let userId = this.state.user;

    if ( this.props.user != this.state.user ) {
      this.setState({
        user: this.props.user,
        hasAvatar: false,
        avatar: null
      })
    } else {

      if ( this.state.hasAvatar === null ) {
        let fetchUserPromise = null;

        if ( userCache.hasOwnProperty(userId) ) {
          let res = userCache[userId];
          if ( res.hasOwnProperty("err") ) {
            fetchUserPromise = Promise.reject(res.err);
          } else {
            fetchUserPromise = Promise.resolve(res.user);
          }
        } else {
          fetchUserPromise = this.props.fetchUser(userId);
        }

        fetchUserPromise
          .then((user) => {
            userCache[userId] = { user };
            if ( this._mounted ) {
              this.setState({
                avatar: user.avatar,
                hasAvatar: user.avatar?true:false,
                tooltip: user.fullname
              });
            }
          })
          .catch((err) => {
            userCache[userId] = { err };
            if ( this._mounted ) {
              this.setState({
                avatar: "",
                tooltip: userId,
                hasAvatar: false
              });
            }
          });
      }
    }
  }

  componentDidUpdate() {
    this.fetchUser();
  }

  componentDidMount() {
    this._mounted = true;
    this.fetchUser();
  }

  componentWillUnmount() {
    this._mounted = false;
  }


  render() {
    let avatarComp = (<Spinner size="40" />)

    if ( this.state.hasAvatar === true ) {
      avatarComp = (<img src={this.state.avatar} />)
    } else if ( this.state.hasAvatar === false ) {
      avatarComp = (<Icon iconSize="40" icon="person" />)
    }

    return <div className="user-avatar">
      <Tooltip text={this.state.tooltip}>{ avatarComp }</Tooltip>
    </div>
  }
}