import React from 'react';
import {
  ButtonGroup,
  Button
} from '@blueprintjs/core';
import classNames from 'classnames';

const cloneItems = (items) => {
  let newItems = items.splice(0);
  return newItems.map(o => {
    let override = {};
    if ( o.subItems ) {
      override = {
        subItems: cloneItems(o.subItems)
      }
    }
    return Object.assign(override, o);
  });
}

export class NavMenu extends React.PureComponent {

  constructor(props) {
    super(props);

    this.state = {
      displayNavText: false,
      items: props.initialItems || []
    }
  }

  hasSubMenu(menu, sub) {
    let found = false;
    this.state.items.forEach(m => {
      if ( m.id == menu && m.subItems ) {
        m.subItems.forEach(s => {
          if ( s == sub ) {
            found = true;
          }
        });
      }
    });

    return found;
  }

  addSubMenu(menu, subItem) {
    // avoid mutation
    let items = cloneItems(this.state.items);
    
    let found = items.filter(m => m.id == menu);
    if ( found.length == 1 ) {
      found = found[0];
      found.subItems = found.subItems || [];
      found.subItems.push(subItem);

      this.setState({
        items
      });
    }
  }

  buildItem(item) {
    if ( item.isFill ) {
      return <div key="fill" className='flex-fill' />
    }

    const navText = (text) => {
      return this.state.displayNavText ? text : '';
    }

    const isActive = item.isActive && item.isActive();

    return <ButtonGroup key={item.id} minimal vertical
      className={classNames(
        'nav-item',
        {
          'active': item.isActive()
        }
      )}
    >
      <Button text={navText(item.label)} icon={item.icon} onClick={item.onSelect} />
      {item.isActive() && item.subItems && (
        <ButtonGroup minimal vertical className='inner'>
          { item.subItems.map(sub => this.buildItem(sub)) }
        </ButtonGroup>
      )}
    </ButtonGroup>

  }

  render() {
    const { displayNavText } = this.state;
    const navProps = {
      vertical: true,
      alignText: 'left',
      large: true,
      minimal: true,
      className: classNames('bp3-dark', { 'is-open': displayNavText }),
      id: 'nav'
    }

    const navText = (text) => {
      return displayNavText ? text : '';
    }

    const isPathActive = (match, location) => {
      return location.pathname.match(match);
    }

    const toggleDisplayNavText = () => this.setState({ displayNavText: !displayNavText })

    return <ButtonGroup {...navProps} >

      <Button
        text={navText('Navigation')}
        rightIcon={displayNavText ? 'caret-left' : 'caret-right'}
        onClick={toggleDisplayNavText} />

      <React.Fragment>
        { this.state.items.map(item => this.buildItem(item)) }
      </React.Fragment>
    </ButtonGroup>
  }
}

export default NavMenu;