import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import AccountCircle from '@material-ui/icons/AccountCircle';
import MenuItem from '@material-ui/core/MenuItem';
import Menu from '@material-ui/core/Menu';
import Drawer from '@material-ui/core/Drawer';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import AddCircleIcon from '@material-ui/icons/AddCircle';

const drawerWidth = 240;

const styles = theme => ({
    root: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        flexGrow: 1,
    },
    appBar: {
        zIndex: theme.zIndex.drawer + 1
    },
    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },
    drawerPaper: {
        width: drawerWidth,
    },
    drawerContainer: {
        overflow: 'auto',
    },
    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },
});

class MenuAppBar extends React.Component {
    state = {
        'anchorEl': null,
        'drawerOpen': false,
    };

    render() {
        const intl = this.props.intl;
        const { classes } = this.props;
        const open = Boolean(this.state.anchorEl);

        const handleMenu = (event) => {
            this.setState({
                'anchorEl': event.currentTarget
            });
        };

        const handleLogout = () => {
            window.location.href = '/_gcp_iap/clear_login_cookie';
        };

        const handleClose = () => {
            this.setState({
                'anchorEl': null
            });
        };

        const handleDrawer = (event) => {
            this.setState({
                'drawerOpen': !this.state.drawerOpen
            });

        };

        const handleDrawerItemSelected = (event, item) => {
            console.log('LBINK', item);
            this.props.onDrawerItemSelected(item);
            this.setState({
                'drawerOpen': false
            });
        };

        return (
            <div className={classes.root}>
                <AppBar position="fixed" className={classes.appBar}>
                    <Toolbar variant="dense">
                        <IconButton edge="start" className={classes.menuButton} color="inherit" aria-label="menu" onClick={handleDrawer}>
                            <MenuIcon />
                        </IconButton>
                        <Typography variant="h6" className={classes.title}>
                            {this.props.title}
                        </Typography>
                        <div>
                            <IconButton
                                aria-label="account of current user"
                                aria-controls="menu-appbar"
                                aria-haspopup="true"
                                onClick={handleMenu}
                                color="inherit"
                            >
                                <AccountCircle />
                            </IconButton>
                            <Menu
                                id="menu-appbar"
                                anchorEl={this.state.anchorEl}
                                anchorOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                keepMounted
                                transformOrigin={{
                                    vertical: 'top',
                                    horizontal: 'right',
                                }}
                                open={open}
                                onClose={handleClose}
                            >
                                <MenuItem onClick={handleLogout}>Log out</MenuItem>
                            </Menu>
                        </div>
                    </Toolbar>
                </AppBar>
                <Drawer anchor="left" open={this.state.drawerOpen} variant="persistent" className={classes.drawer} classes={{
                    paper: classes.drawerPaper,
                }}>
                    <Toolbar variant="dense" />
                    <div className={classes.drawerContainer}>
                        <List>
                            <ListItem button key="menu-frontpage" onClick={(event) => { handleDrawerItemSelected(event, 'home'); }} >
                                <ListItemIcon><HomeIcon /></ListItemIcon>
                                <ListItemText primary={intl.formatMessage({ id: "menuHome" })} />
                            </ListItem>
                            <ListItem button key="menu-add-project" onClick={(event) => { handleDrawerItemSelected(event, 'add-project'); }} >
                                <ListItemIcon><AddCircleIcon /></ListItemIcon>
                                <ListItemText primary={intl.formatMessage({ id: "menuAddProject" })} />
                            </ListItem>
                        </List>
                    </div>
                </Drawer>
                <Toolbar variant="dense" />
            </div>
        );
    }
}

export default injectIntl(withStyles(styles)(MenuAppBar));