import React from 'react';
import './App.css';

import { withStyles } from '@material-ui/styles';
import Box from '@material-ui/core/Box';
import MenuAppBar from './common/AppBar';
import { injectIntl } from 'react-intl';

import ProjectApp from './ProjectApp';
import Frontpage from './common/Frontpage';

const styles = (theme) => ({
    table: {
    },
    backdrop: {
        zIndex: 10000,
    }
});

class App extends React.Component {
    state = {
        showFrontpage: true,
        showProject: false,
        apiEndpoints: JSON.parse(document.getElementById('root').getAttribute('data-api-endpoints')),
        frontPageContents: { 'id': 'frontpage', 'title': '', 'content': '' },
    };

    componentDidMount() {
        fetch(this.state.apiEndpoints.apiEndpoints['cms'] + '/v1/cms/frontpage')
            .then(res => res.json())
            .then((data) => {
                this.setState({
                    'frontPageContents': data
                });
            })
            .catch(console.log);
    }

    render() {
        const intl = this.props.intl;
        // const { classes } = this.props;

        /*
        const lineBreaker = (input) => {
            return input.split('\n').map((item, key) => {
                return (<span key={key}>{item}<br /></span>)
            });
        };
        */

        const handleDrawerItemSelected = (item) => {
            if (item === 'home') {
                this.setState({
                    'showFrontpage': true,
                    'showProject': false
                });
            }
            if (item === 'add-project') {
                this.setState({
                    'showFrontpage': false,
                    'showProject': true
                });
            }
        };

        return (
            <div className="App">
                <header className="App-header">
                    <MenuAppBar title={intl.formatMessage({ id: "title" })} onDrawerItemSelected={handleDrawerItemSelected}>
                        {intl.formatMessage({ id: "title" })}
                    </MenuAppBar>
                </header>
                <Box m={2} maxWidth={900} id="frontpage">
                    {this.state.showFrontpage ? (<Frontpage content={this.state.frontPageContents} onAddNewProject={() => { handleDrawerItemSelected('add-project'); }} />) : ''}
                </Box>
                <Box m={2} maxWidth={900} id="project">
                    {this.state.showProject ? (<ProjectApp apiEndpoints={this.state.apiEndpoints}></ProjectApp>) : ''}
                </Box>
            </div >
        );
    }
}

export default injectIntl(withStyles(styles)(App));
