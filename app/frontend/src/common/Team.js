import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';

import Accordion from '@material-ui/core/Accordion';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';

import Avatar from '@material-ui/core/Avatar';
import PersonIcon from '@material-ui/icons/Person';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';

import Input from '@material-ui/core/Input';

import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';

import AddMember from './AddMember';

const styles = theme => ({
    root: {
        width: '100%',
        marginTop: 4,
    },
    heading: {
        fontSize: theme.typography.pxToRem(15),
        flexBasis: '33.33%',
        flexShrink: 0,
    },
    secondaryHeading: {
        fontSize: theme.typography.pxToRem(15),
        color: theme.palette.text.secondary,
    },
    autocompleteIcon: {
        marginRight: 5,
        width: '40px',
        height: '40px',
    },
    maskedImage: {
        borderRadius: '50%',
    }
});

class Team extends React.Component {
    state = {
        expanded: null,
        teams: this.props.teams,
        teamMembers: {},
        userSearchResults: [],
        groupSearchResults: [],
        searchResults: [],
        memberLoading: false,
        error: '',
    };

    handleChange = panel => (event, expanded) => {
        this.setState({
            expanded: expanded ? panel : false,
        });
    };

    renderTeam(team) {
        // const intl = this.props.intl;
        const { classes } = this.props;
        const { teamMembers } = this.state;

        const handleAddUser = (event, value) => {
            let valueExists = false;
            if (!teamMembers.hasOwnProperty(team)) {
                teamMembers[team] = [];
            }
            teamMembers[team].forEach((m, i) => {
                if (m.email === value.email) {
                    valueExists = true;
                }
            });
            if (!valueExists) {
                teamMembers[team].push(value);
            }
            this.props.onUpdateTeams(this.state.teamMembers);
        };

        const handleRemoveUser = (id) => {
            let newTeamMembers = teamMembers;
            newTeamMembers[team] = teamMembers[team].filter(function (m) {
                if (m.username !== id) {
                    return m;
                }
                return null;
            });
            this.setState({
                'teamMembers': newTeamMembers
            });
            this.props.onUpdateTeams(this.state.teamMembers);
        };

        return (
            <List className={classes.root} >
                {
                    teamMembers.hasOwnProperty(team) ? teamMembers[team].map((m, i) => (
                        <ListItem key={`${team}-${m.email}`}>
                            <ListItemAvatar>
                                <Avatar>
                                    {m.photo ? (
                                        <img width="40" height="40" alt={m.name} className={classes.maskedImage} src={`data:image/jpeg;base64,${m.photo.replace(/_/g, '/').replace(/-/g, '+').replace(/\*/, '=').replace(/\./, '=')}`} />
                                    ) : (
                                            <PersonIcon className={classes.autocompleteIcon} />
                                        )
                                    }
                                </Avatar>
                            </ListItemAvatar>
                            <Input type="hidden" name={`team[${team}][]`} value={m.email} />
                            <ListItemText primary={m.name} secondary={m.title} />
                            <ListItemSecondaryAction>
                                <IconButton edge="end" aria-label="delete" onClick={() => handleRemoveUser(m.username)}>
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>)
                    ) : ""
                }
                <AddMember
                    team={team}
                    onAddUser={handleAddUser}
                    apiEndpointUsers={this.props.apiEndpointUsers}
                    apiEndpointGroups={this.props.apiEndpointGroups} />
            </List >
        );
    };

    render() {
        const { classes } = this.props;
        const { expanded } = this.state;

        return (
            <div className={classes.root}>
                {Object.keys(this.state.teams).length > 0 ?
                    this.state.teams.map((g, i) => (<Accordion expanded={expanded === g.id} key={`team-${g.id}`} onChange={this.handleChange(g.id)} >
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography className={classes.heading}>{g.title} ({this.state.teamMembers.hasOwnProperty(g.id) ? this.state.teamMembers[g.id].length : 0})</Typography>
                            <Typography className={classes.secondaryHeading}>{g.description}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {this.renderTeam(g.id)}
                        </AccordionDetails>
                    </Accordion >)) : ''}
                <Snackbar open={this.state.error !== ''} autoHideDuration={6000} onClose={() => { this.setState({ 'error': '' }); }}>
                    <MuiAlert elevation={6} variant="filled" onClose={() => { this.setState({ 'error': '' }); }} severity="error">
                        {this.state.error}
                    </MuiAlert>
                </Snackbar>
            </div >
        );
    }
}

Team.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(Team));