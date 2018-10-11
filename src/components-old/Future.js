import React from 'react'

/**
 * Manages displaying conditional elements when a promise is in the process of resolving(or not)
 */
export class Future extends React.PureComponent {
    constructor(props) {
        super(props);

        this.state = {
            waiting: 0,
            total: 0,
            id: 0,
            error: null,
            render: this.props.onRender
        }
    }

    componentDidMount() {
        if ( this.props.interface ) {
            console.log("interface init", this);
            this.props.interface(this);
        }
    }

    _onPromiseResolve(id, result) {
        console.log("Resolve... ", id);
        if ( this.state.id == id ) {
            this.setState(prevState => ({
                ...prevState,
                waiting: prevState.waiting - 1,
                render: prevState.waiting <= 1?this.props.onRender:this.props.onWait
            }));
        }
        return result;
    }

    _onPromiseCatch(id, err) {
        console.log("Catch... ", id);
        if ( this.state.id == id ) {
            this.setState(prevState => ({
                ...prevState,
                waiting: 0,
                render: this.props.onFail,
                error: err
            }));
        }
        throw err;
    }

    waitPromise(promise) {

        console.log("Add promise... ");


        // as promises come in, we up our wait counter
        this.setState(prevState => ({
            ...prevState,
            waiting: prevState.waiting + 1,
            total: prevState.waiting == 0 ? 0 : prevState.total + 1,
            render: this.props.onWait,
            id: prevState.waiting == 0 ? prevState.id + 1 : prevState.id
        }), () => {
            console.log("Waiting: ", this.state);

            // poor man's Promise.always
            promise
                .then(this._onPromiseResolve.bind(this, this.state.id))
                .catch(this._onPromiseCatch.bind(this, this.state.id));
        })
    }

    render() {
        if ( this.state.error ) {
            return this.state.render(this, this.state.error);
        } else {
            return this.state.render(this);
        }
    }
}