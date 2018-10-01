// --- app Framework
import React from 'react'
import { MemoryRouter, Route, NavLink, Switch, Redirect } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { BackendProvider, BackendConsumer } from '../connectors/Data';
import { Condition, When } from 'bloom-conditionals';

// --- ui framework
import { Button, ButtonGroup, Spinner, Intent, Alignment, Position, Toaster, Toast } from '@blueprintjs/core';
import classNames from 'classnames';

// --- Pages 
import Timesheet from './Timesheet';
import Settings from './Settings';
import Login from './Login';
import EditEntry from './EditEntry';
import NavMenu from './Nav';

export class AppUI extends React.Component {

  constructor(props) {
    super(props);
    
    this.state = {
      displayNavText: false,
      navMenu: null,
      navItems: [
        {
          id: "timesheet",
          label: "Timesheet",
          icon: "cog",
          isActive: () => this.isPathActive(/^\/timesheet/),
          onSelect: () => this.props.history.push('/timesheet')
        },
        { isFill: true },
        {
          id: "settings",
          label: "Settings",
          icon: "calendar",
          isActive: () => this.isPathActive(/^\/settings/),
          onSelect: () => this.props.history.push('/settings')
        }
      ]
    }

    this.refHandlers = {
      nav: (ref) => { this.state.navMenu == null && this.setState({navMenu: ref}) }
    }
  }

  isPathActive(match, location) {
    return this.props.location.pathname.match(match);
  }

  render() {
    const { backend, location } = this.props;

    if ( location.pathname == '/' ) {
      return <Redirect to='/timesheet' />
    }
    
    return <div id='app'>

      { /* Navigation */ }
      <NavMenu initialItems={this.state.navItems} ref={(ref) => this.refHandlers.nav(ref)} />

      <div id='content'>
            <Switch location={location}>

              <Route path='/timesheet' render={props => <Timesheet navMenu={this.state.navMenu} backend={backend} {...props}/>} />
              <Route path='/settings' exact component={Settings} />

            </Switch>
      </div>
    </div>
  }
}

export class AppRouter extends React.Component {

  componentDidMount() {
    if ( this.props.backend === undefined ) {
      return;
    }

    let auth = {
      host: ipcRenderer.sendSync('getSetting', 'host'),
      usr: ipcRenderer.sendSync('getSetting', 'usr'),
      pwd: ipcRenderer.sendSync('getSetting', 'pwd'),
    };

    this.props.backend.actions.setAuth(auth);

    if ( auth.host && auth.usr && auth.pwd ) {
      this.props.backend.actions.login(auth)
    }

    /*
    setInterval(() => {
      // issue checking for idle time every 60 seconds
      ipcRenderer.send('getIdleTime');
    }, 60000); // once a minute check

    // wait for idle query response
    ipcRenderer.on('setIdleTime', (event, arg) => {
      this.setState({
        lastIdle: arg
      });
    })*/
  }

  render() {
    const { backend } = this.props;

    if ( backend === undefined ) {
      return [];
    }

    if ( backend.errors.length > 0 ) {
      backend.errors.forEach(err => console.error(err) );
    }

    return <Route render={
      ({ location, history }) => <React.Fragment>
        <Toaster 
          ref={backend.refHandlers.toaster}
          position={Position.TOP}
        >
          { backend.errors.map(err => <Toast 
              {...err}
              key={err.message}
              message={err.message}
              onDismiss={() => {
                backend.actions.dismissError(err)
              }}
            />) }
        </Toaster>
        <Condition test={ backend.loggedState }>
          <When value={value => value=='none' || value=='failed'}>
            <div id='app' className='bp3-dark'>
              <div id='content'>
                <div className='dead-center'>
                  <Login {...backend.auth} onLoginAction={backend.actions.login} />
                </div>
              </div>
            </div>
          </When>
          <When value="acquiring">
            <div id='app' className='bp3-dark'>
              <div id='content'>
                <div className='dead-center'>
                  <Spinner size={Spinner.SIZE_LARGE} />
                </div>
              </div>
            </div>
          </When>
          <When value="acquired">
            <AppUI location={location} backend={backend} history={history} />
          </When>
        </Condition>
      </React.Fragment>
    } />
  }
}

export const App = (props) => {
  return (
      <BackendProvider >
        <BackendConsumer>
          {backend =><MemoryRouter>
              <AppRouter backend={backend} {...props} /> 
            </MemoryRouter>
          }
        </BackendConsumer>
      </BackendProvider>
  )
}

export default App;
